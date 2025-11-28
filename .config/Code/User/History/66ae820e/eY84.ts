// src/routes/item.ts
import express, { Request, Response } from "express";
import { db } from "../db";
import { items, dheetos} from "../db/schema";
import { eq, and} from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { isValidUUID, recalculatePersonTotals } from "../utils";
import { sendError, sendSuccess, sendSuccessMessage } from "../utils";
import { ItemIdParams, AddItemBody, AddItemResponse, UpdateItemBody, UpdateItemResponse, DeleteItemResponse } from "../types";

const router = express.Router();

// POST /dheeto/:dheetoId/add-item
router.post("/dheeto/:dheetoId/add-item", async (req: Request<ItemIdParams, {}, AddItemBody>, res: Response<AddItemResponse>): Promise<void> => {
  try {
    const { dheetoId } = req.params;
    const { name, type, purity, weightInTola, desc } = req.body;

    if (!isValidUUID(dheetoId)) return void sendError(res, "Invalid dheeto ID format", 400);
    if (!name?.trim()) return void sendError(res, "Item name is required", 400);
    if (name.length > 100) return void sendError(res, "Item name cannot exceed 100 characters", 400);
    if (!["gold", "silver"].includes(type)) return void sendError(res, "Item type must be either 'gold' or 'silver'", 400);
    if (purity < 0 || purity > 24) return void sendError(res, "Item purity must be between 0 and 24", 400);
    if (weightInTola <= 0) return void sendError(res, "Item weight must be positive", 400);

    // Check if dheeto exists
    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();
    if (!dheeto) return void sendError(res, "Dheeto not found", 404);

    const itemId = uuidv4();
    const now = new Date();

    // Insert new item
    await db.insert(items).values({
      id: itemId,
      dheetoId,
      name: name.trim(),
      type,
      purity: purity ?? 24,
      weightInTola,
      desc: desc?.trim() || null,
      createdAt: now,
      isSettled: false,
      settledAt: null,
    });

    // Update dheeto's updatedAt
    await db.update(dheetos).set({ updatedAt: now }).where(eq(dheetos.id, dheetoId));

    // Recalculate person totals
    await recalculatePersonTotals(dheeto.personId);

    // Fetch updated dheeto with items
    const updatedDheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();

    sendSuccess(res, updatedDheeto, 201);
  } catch (error) {
    console.error("Error adding item:", error);
    sendError(res, "Internal server error", 500);
  }
});


// GET /dheeto/:dheetoId/items
router.get("/dheeto/:dheetoId/items", async (req: Request, res: Response): Promise<void> => {
  try {
    const { dheetoId } = req.params;

    if (!isValidUUID(dheetoId)) {
      return void sendError(res, "Invalid dheeto ID format", 400);
    }

    // Check if dheeto exists
    const dheeto = await db
      .select()
      .from(dheetos)
      .where(eq(dheetos.id, dheetoId))
      .get();

    if (!dheeto) {
      return void sendError(res, "Dheeto not found", 404);
    }

    // Fetch items for this dheeto
    const allItems = await db
      .select()
      .from(items)
      .where(eq(items.dheetoId, dheetoId));

    sendSuccess(res, allItems);
  } catch (error) {
    console.error("Error fetching items:", error);
    sendError(res, "Internal server error", 500);
  }
});


// PUT /dheeto/:dheetoId/item/:itemId
router.put("/dheeto/:dheetoId/item/:itemId", async (req: Request<ItemIdParams, {}, UpdateItemBody>, res: Response<UpdateItemResponse>): Promise<void> => {
  try {
    const { dheetoId, itemId } = req.params;
    const { name, type, purity, weightInTola, desc, isSettled, settledAt } = req.body;

    if (!isValidUUID(dheetoId) || !isValidUUID(itemId)) return void sendError(res, "Invalid ID format", 400);

    // Check if item exists and belongs to the dheeto
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.dheetoId, dheetoId)))
      .get();

    if (!item) return void sendError(res, "Dheeto or item not found", 404);

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) return void sendError(res, "Item name cannot be empty", 400);
      if (name.length > 100) return void sendError(res, "Item name cannot exceed 100 characters", 400);
      updateData.name = name.trim();
    }

    if (type !== undefined) {
      if (!["gold", "silver"].includes(type)) return void sendError(res, "Item type must be either 'gold' or 'silver'", 400);
      updateData.type = type;
    }

    if (purity !== undefined) {
      if (purity < 0 || purity > 24) return void sendError(res, "Item purity must be between 0 and 24", 400);
      updateData.purity = purity;
    }

    if (weightInTola !== undefined) {
      if (weightInTola <= 0) return void sendError(res, "Item weight must be positive", 400);
      updateData.weightInTola = weightInTola;
    }

    if (desc !== undefined) {
      updateData.desc = desc?.trim() || null;
    }

    if ((isSettled !== undefined && settledAt === undefined) || (isSettled === undefined && settledAt !== undefined)) {
      return void sendError(res, "Both isSettled and settledDate must be provided together", 400);
    }

    if (isSettled !== undefined && settledAt !== undefined) {
      updateData.isSettled = isSettled;
      updateData.settledAt = settledAt;
    }

    if (Object.keys(updateData).length === 0) return void sendError(res, "No valid fields to update", 400);

    // Update the item
    await db.update(items).set(updateData).where(eq(items.id, itemId));

    // Update dheeto's updatedAt
    await db.update(dheetos).set({ updatedAt: new Date() }).where(eq(dheetos.id, dheetoId));

    // Get the dheeto to find personId
    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();
    if (dheeto) {
      await recalculatePersonTotals(dheeto.personId);
    }

    // Fetch updated dheeto
    const updatedDheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();

    sendSuccess(res, updatedDheeto);
  } catch (error) {
    sendError(res, "Internal server error", 500);
  }
});

// DELETE /dheeto/:dheetoId/item/:itemId
router.delete("/dheeto/:dheetoId/item/:itemId", async (req: Request<ItemIdParams>, res: Response<DeleteItemResponse>): Promise<void> => {
  try {
    const { dheetoId, itemId } = req.params;

    if (!isValidUUID(dheetoId) || !isValidUUID(itemId)) return void sendError(res, "Invalid ID format", 400);

    // Check if item exists and belongs to the dheeto
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.dheetoId, dheetoId)))
      .get();

    if (!item) return void sendError(res, "Dheeto or item not found", 404);

    // Delete the item
    await db.delete(items).where(eq(items.id, itemId));

    // Update dheeto's updatedAt
    await db.update(dheetos).set({ updatedAt: new Date() }).where(eq(dheetos.id, dheetoId));

    // Get the dheeto to find personId
    const dheeto = await db.select().from(dheetos).where(eq(dheetos.id, dheetoId)).get();
    if (dheeto) {
      await recalculatePersonTotals(dheeto.personId);
    }

    sendSuccessMessage(res, "Item deleted successfully");
  } catch (error) {
    console.error("Error deleting item:", error);
    sendError(res, "Internal server error", 500);
  }
});

export default router;