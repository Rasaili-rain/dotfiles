// src/routes/dheeto_router.ts
import express, { Request, Response } from "express";


const router = express.Router();

// POST /add-dheeto
router.post("/add-dheeto", async (req: Request<{}, {}, CreateDheetoBody>, res: Response<AddDheetoResponse>): Promise<void> => {
  try {
    const { personId, desc, initialItems = [], initialTransactions = [] } = req.body;

    if (!isValidUUID(personId)) return void sendError(res, "Invalid person ID format", 400);

    // Validate person exists
    const person = await db.select().from(persons).where(eq(persons.id, personId)).get();
    if (!person) return void sendError(res, "Person not found", 404);

    // Validate initial items
    for (const item of initialItems) {
      if (!item.name?.trim()) return void sendError(res, "Item name is required", 400);
      if (item.name.length > 100) return void sendError(res, "Item name cannot exceed 100 characters", 400);
      if (!["gold", "silver"].includes(item.type)) return void sendError(res, "Item type must be 'gold' or 'silver'", 400);
      if (item.purity < 0 || item.purity > 24) return void sendError(res, "Item purity must be between 0 and 24", 400);
      if (item.weightInTola <= 0) return void sendError(res, "Item weight must be positive", 400);
    }

    // Validate initial transactions
    for (const transaction of initialTransactions) {
      if (!["gave", "received"].includes(transaction.type)) return void sendError(res, "Transaction type must be 'gave' or 'received'", 400);
      if (transaction.amount <= 0) return void sendError(res, "Transaction amount must be positive", 400);
    }

    // Calculate initial balance
    const initialBalance = initialTransactions.reduce((b, t) => (t.type === "gave" ? b - t.amount : b + t.amount), 0);

    const dheetoId = uuidv4();
    const now = new Date();

    // Insert dheeto
    await db.insert(dheetos).values({
      id: dheetoId,
      personId,
      isSettled: false,
      createdAt: now,
      updatedAt: now,
      dheetoBalance: initialBalance,
      desc: desc?.trim() || null,
    });

    // Insert initial items
    if (initialItems.length > 0) {
      await db.insert(items).values(
        initialItems.map((item) => ({
          id: uuidv4(),
          dheetoId,
          name: item.name.trim(),
          type: item.type,
          purity: item.purity,
          weightInTola: item.weightInTola,
          createdAt: now,
          isSettled: false,
          settledAt: null,
          desc: item.desc?.trim() || null,
        }))
      );
    }

    // Insert initial transactions
    if (initialTransactions.length > 0) {
      await db.insert(transactions).values(
        initialTransactions.map((transaction) => ({
          id: uuidv4(),
          dheetoId,
          type: transaction.type,
          amount: transaction.amount,
          createdAt: now,
          desc: transaction.desc?.trim() || null,
        }))
      );
    }

    // Update person counts
    await db
      .update(persons)
      .set({
        unsettledDheetosCount: sql`${persons.unsettledDheetosCount} + 1`,
        totalDheetosCount: sql`${persons.totalDheetosCount} + 1`,
      })
      .where(eq(persons.id, personId));

    // Recalculate person totals
    await recalculatePersonTotals(personId);

    // Fetch the created dheeto
    const createdDheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();

    sendSuccess(res, createdDheeto, 201);
  } catch (error: any) {
    sendError(res, "Error creating dheeto", 500, error);
  }
});

// GET /dheeto/:id
router.get("/dheeto/:id", async (req: Request<DheetoIdParams, {}, {}>, res: Response<GetDheetoResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return void sendError(res, "Invalid dheeto ID format", 400);

    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, id)).get();

    if (!dheeto) return void sendError(res, "Dheeto not found", 404);

    sendSuccess(res, dheeto);
  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
});

// GET /all-dheetos
router.get("/all-dheetos", async (req: Request<{}, {}, {}, GetAllDheetosQuery>, res: Response<GetAllDheetosResponse>): Promise<void> => {
  try {
    const { personId, isSettled = "all", page = 1, limit = 50, sortBy = "createdAt", order = "desc" } = req.query;

    const pageNum = page < 1? 1:page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const filters: any[] = [];
    if (personId) filters.push(eq(dheetos.personId, personId));
    if (isSettled === "true") filters.push(eq(dheetos.isSettled, true));
    else if (isSettled === "false") filters.push(eq(dheetos.isSettled, false));

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Determine sort column and direction
    const sortCol = sortBy === "updatedAt" ? dheetos.updatedAt : dheetos.createdAt;
    const sortDir = order === "asc" ? ascOrder : descOrder;

    // Fetch data
    const data = await db.select().from(dheetos).where(whereClause).orderBy(sortDir(sortCol)).limit(limitNum).offset(skip).all();

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dheetos)
      .where(whereClause)
      .get();

    const total = totalResult?.count || 0;

    sendPaginatedSuccess(res, data, buildPagination(pageNum, limitNum, total));
  } catch (error) {
    sendError(res, "Error fetching dheetos", 500, error);
  }
});

// GET /search-dheetos
router.get("/search-dheetos", async (req: Request<{}, {}, {}, SearchDheetosQuery>, res: Response<SearchDheetosResponse>): Promise<void> => {
  try {
    const { personId, isSettled = "false", createdAfter, createdBefore, desc, page = 1, limit = 50 } = req.query;

    if (!personId && !isSettled && !createdAfter && !createdBefore && !desc) {
      return void sendError(res, "At least one search parameter is required", 400);
    }

     const pageNum = page < 1? 1:page;
    const limitNum = limit;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const filters: any[] = [];

    if (personId) filters.push(eq(dheetos.personId, personId));
    if (isSettled === "true") filters.push(eq(dheetos.isSettled, true));
    else if (isSettled === "false") filters.push(eq(dheetos.isSettled, false));
    if (desc) filters.push(like(dheetos.desc, `%${desc}%`));

    if (createdAfter) {
      const date = new Date(createdAfter);
      if (isNaN(date.getTime())) return void sendError(res, "Invalid createdAfter date", 400);
      filters.push(gte(dheetos.createdAt, date));
    }

    if (createdBefore) {
      const date = new Date(createdBefore);
      if (isNaN(date.getTime())) return void sendError(res, "Invalid createdBefore date", 400);
      filters.push(lte(dheetos.createdAt, date));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Fetch data
    const data = await db.select().from(dheetos).where(whereClause).orderBy(descOrder(dheetos.createdAt)).limit(limitNum).offset(skip).all();

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dheetos)
      .where(whereClause)
      .get();

    const total = totalResult?.count || 0;

    sendPaginatedSuccess(res, data, buildPagination(pageNum, limitNum, total));
  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
});

// PUT /dheeto/:id
router.put("/dheeto/:id", async (req: Request<DheetoIdParams, {}, UpdateDheetoBody>, res: Response<UpdateDheetoResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    const { desc, isSettled } = req.body;

    if (!isValidUUID(id)) return void sendError(res, "Invalid dheeto ID format", 400);

    // Find the dheeto
    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, id)).get();
    if (!dheeto) return void sendError(res, "Dheeto not found", 404);

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (desc !== undefined) {
      updateData.desc = desc.trim() || null;
    }

    if (isSettled !== undefined && dheeto.isSettled !== isSettled) {
      updateData.isSettled = isSettled;

      // If settling, update all items
      if (isSettled) {
        await db.update(items).set({ isSettled: true, settledAt: now }).where(eq(items.dheetoId, id));

        // Decrement unsettled count
        await db
          .update(persons)
          .set({ unsettledDheetosCount: sql`${persons.unsettledDheetosCount} - 1` })
          .where(eq(persons.id, dheeto.personId));
      } else {
        // Increment unsettled count
        await db
          .update(persons)
          .set({ unsettledDheetosCount: sql`${persons.unsettledDheetosCount} + 1` })
          .where(eq(persons.id, dheeto.personId));
      }
    }

    if (Object.keys(updateData).length === 1) {
      return void sendError(res, "No valid fields to update", 400);
    }

    // Update the dheeto
    const updated = await db.update(dheetos).set(updateData).where(eq(dheetos.id, id)).returning().get();

    if (!updated) return void sendError(res, "Dheeto not found", 404);

    sendSuccess(res, updated);
  } catch (error) {
    sendError(res, "Internal server error", 500, error);
  }
});

// DELETE /dheeto/:id
router.delete("/dheeto/:id", async (req: Request<DheetoIdParams>, res: Response<DeleteDheetoResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) return void sendError(res, "Invalid dheeto ID format", 400);

    // Find the dheeto
    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, id)).get();
    if (!dheeto) return void sendError(res, "Dheeto not found", 404);

    // Delete the dheeto (cascade will handle items and transactions)
    await db.delete(dheetos).where(eq(dheetos.id, id));

    // Update person counts
    const decrementData: any = { totalDheetosCount: sql`${persons.totalDheetosCount} - 1` };
    if (!dheeto.isSettled) {
      decrementData.unsettledDheetosCount = sql`${persons.unsettledDheetosCount} - 1`;
    }

    await db.update(persons).set(decrementData).where(eq(persons.id, dheeto.personId));

    // Recalculate person totals
    await recalculatePersonTotals(dheeto.personId);

    sendSuccessMessage(res, "Dheeto deleted successfully");
  } catch (error) {
    sendError(res, "Error deleting dheeto", 500, error);
  }
});

export default router;
