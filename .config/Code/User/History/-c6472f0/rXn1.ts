// src/routes/person.ts
import express, { Request, Response } from "express";
import { db } from "../db"; 
import { persons } from "../db/schema";
import { eq, like, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { buildPagination, isValidUUID, sendError, sendPaginatedSuccess, sendSuccess, sendSuccessMessage } from "../utils";
import { CreatePersonBody, AddPersonResponse, GetAllPersonsQuery, GetAllPersonsResponse, PersonIdParams, GetPersonResponse, SearchPersonQuery, SearchPersonResponse, UpdatePersonBody, UpdatePersonResponse, DeletePersonResponse } from "../types";

const router = express.Router();

// POST /add-person
router.post("/add-person", async (req: Request<{}, {}, CreatePersonBody>, res: Response<AddPersonResponse>): Promise<void> => {
  try {
    const { name, phoneNo, desc } = req.body;

    if (!name?.trim()) return sendError(res, "Name is required", 400);
    if (name.length > 100) return sendError(res, "Name cannot exceed 100 characters", 400);
    if (phoneNo && !/^\d{10}$/.test(phoneNo)) return sendError(res, "Phone number must be exactly 10 digits", 400);

    const id = uuidv4();
    const createdAt = new Date();

    await db.insert(persons).values({
      id,
      name: name.trim(),
      phoneNo: phoneNo?.trim() || null,
      desc: desc?.trim() || null,
      createdAt,
      totalBalance: 0,
      totalSilver: 0,
      totalGold: 0,
      unsettledDheetosCount: 0,
    });

    const person = await db.query.persons.findFirst({ where: eq(persons.id, id) });
    sendSuccess(res, person, 201);
  } catch (err: any) {
    if (String(err).includes("UNIQUE")) return sendError(res, "Phone number already exists", 409);
    sendError(res, "Internal server error", 500,err);
  }
});

// GET /all-person
router.get("/all-person", async (req: Request<{}, {}, {}, GetAllPersonsQuery>, res: Response<GetAllPersonsResponse>): Promise<void> => {

  try {
    const { page = 1, limit = 50, sortBy = "name", order = "asc", includeSettled = "true" } = req.query;

    const pageNum = page;
    const limitNum = limit;
    const offset = (pageNum - 1) * limitNum;

    const validSortFields = { name: persons.name, phoneNo: persons.phoneNo, createdAt: persons.createdAt };
    const sortCol = validSortFields[sortBy as keyof typeof validSortFields] ?? persons.name;
    const sortDir = order === "desc" ? desc : asc;

    let whereClause: any = undefined;

    if (includeSettled === "false") {
      whereClause = sql`EXISTS (SELECT 1 FROM dheetos WHERE dheetos.personId = persons.id AND dheetos.isSettled = 0)`;
    }

    const data = await db.select().from(persons).where(whereClause).orderBy(sortDir(sortCol)).limit(limitNum).offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(persons)
      .where(whereClause);

    sendPaginatedSuccess(res, data, buildPagination(pageNum, limitNum, total[0].count));
  } catch (err) {
    sendError(res, "Internal server error", 500,err);
  }
});

// GET /person/:id
router.get("/person/:id", async (req: Request<PersonIdParams>, res: Response<GetPersonResponse>): Promise<void> => {

  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, "Invalid person ID format", 400);

    const person = await db.query.persons.findFirst({ where: eq(persons.id, id) });
    if (!person) return sendError(res, "Person not found", 404);

    sendSuccess(res, person);
  } catch (err) {
    sendError(res, "Internal server error", 500,err);
  }
});

// GET /search-person
router.get("/search-person", async (req: Request<{}, {}, {}, SearchPersonQuery>, res: Response<SearchPersonResponse>): Promise<void> => {
  try {
    const { name, phoneNo, createdAfter, createdBefore, page = 1, limit = 50 } = req.query;

    if (!name && !phoneNo && !createdAfter && !createdBefore) return sendError(res, "At least one search parameter is required", 400);

    const pageNum = page;
    const limitNum = limit
    const offset = (pageNum - 1) * limitNum;

    const filters: any[] = [];

    if (name) filters.push(like(persons.name, `%${name}%`));
    if (phoneNo) filters.push(like(persons.phoneNo, `%${phoneNo}%`));

    if (createdAfter) {
      const d = new Date(createdAfter);
      if (isNaN(d.getTime())) return sendError(res, "Invalid createdAfter date", 400);
      filters.push(gte(persons.createdAt, d));
    }
    if (createdBefore) {
      const d = new Date(createdBefore);
      if (isNaN(d.getTime())) return sendError(res, "Invalid createdBefore date", 400);
      filters.push(lte(persons.createdAt, d));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const rows = await db.select().from(persons).where(whereClause).orderBy(desc(persons.createdAt)).limit(limitNum).offset(offset);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(persons)
      .where(whereClause);

    sendPaginatedSuccess(res, rows, buildPagination(pageNum, limitNum, totalRows[0].count));
  } catch (err) {
    sendError(res, "Internal server error", 500,err);
  }
});

// PUT /person/:id
router.put("/person/:id", async (req: Request<PersonIdParams, {}, UpdatePersonBody>, res: Response<UpdatePersonResponse>): Promise<void> => {

  try {
    const { id } = req.params;
    const { name, phoneNo, desc } = req.body;

    if (!isValidUUID(id)) return sendError(res, "Invalid person ID format", 400);
    if (name !== undefined && !name.trim()) return sendError(res, "Name cannot be empty", 400);
    if (name && name.length > 100) return sendError(res, "Name cannot exceed 100 characters", 400);
    if (phoneNo && !/^\d{10}$/.test(phoneNo)) return sendError(res, "Phone number must be exactly 10 digits", 400);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo.trim() || null;
    if (desc !== undefined) updateData.desc = desc.trim() || null;

    if (Object.keys(updateData).length === 0) return sendError(res, "No valid fields to update", 400);

    const updated = await db.update(persons).set(updateData).where(eq(persons.id, id)).returning();

    if (updated.length === 0) return sendError(res, "Person not found", 404);

    sendSuccess(res, updated[0]);
  } catch (err: any) {
    if (String(err).includes("UNIQUE")) return sendError(res, "Phone number already exists", 409);
    sendError(res, "Internal server error", 500,err);
  }
});

// DELETE /person/:id
router.delete("/person/:id", async (req: Request<PersonIdParams>, res: Response<DeletePersonResponse>): Promise<void> => {

  try {
    const { id } = req.params;

    if (!isValidUUID(id)) return sendError(res, "Invalid person ID format", 400);

    const deleted = await db.delete(persons).where(eq(persons.id, id)).returning();
    if (deleted.length === 0) return sendError(res, "Person not found", 404);

    sendSuccessMessage(res, "Person deleted successfully (including all dheetos, items, and transactions)");
  } catch (err) {
    sendError(res, "Internal server error", 500,err);
  }
});

export default router;

