// src/routes/transaction.ts
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { persons, dheetos, transactions } from "../db/schema";
import { eq } from "drizzle-orm";

import { isValidUUID, sendError, sendSuccess, sendSuccessMessage } from "../utils";

import {
  AddTransactionBody,
  UpdateTransactionBody,
  TransactionIdParams,
  DheetoIdParams,
  GetTransactionsByDheetoIdResponse,
  AddTransactionResponse,
  UpdateTransactionResponse,
  DeleteTransactionResponse,
} from "../types"; // Adjust import path accordingly

const router = express.Router();

// ---------------- Utility ----------------
const calculateBalance = (rows: any[]): number => rows.reduce((bal, t) => (t.type === "gave" ? bal - t.amount : bal + t.amount), 0);

router.post<DheetoIdParams, AddTransactionResponse, AddTransactionBody>("/dheeto/:dheetoId/add-transaction", async (req, res) => {
  try {
    const { id } = req.params;
    const dheetoId = id;
    const { type, amount, desc } = req.body;

    if (!isValidUUID(id)) return void sendError(res, "Invalid dheeto ID format", 400);
    if (!["gave", "received"].includes(type)) return void sendError(res, "Transaction type must be either 'gave' or 'received'", 400);
    if (amount <= 0) return void sendError(res, "Transaction amount must be positive", 400);

    const dheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, id),
    });
    if (!dheeto) return void sendError(res, "Dheeto not found", 404);


    await db.insert(transactions).values({
      id :uuidv4(),
      dheetoId,
      type,
      amount,
      desc: desc?.trim() || null,
      createdAt: new Date(),
    });

    const allTx = await db.select().from(transactions).where(eq(transactions.dheetoId, dheetoId));

    const newBalance = calculateBalance(allTx);

    await db.update(dheetos).set({ dheetoBalance: newBalance, updatedAt: new Date() }).where(eq(dheetos.id, dheetoId));

    // Update parent person total
    const personId = dheeto.personId;

    const allDheetos = await db.select().from(dheetos).where(eq(dheetos.personId, personId));

    const newTotal = allDheetos.reduce((sum, d) => sum + (d.dheetoBalance || 0), 0);

    await db.update(persons).set({ totalBalance: newTotal }).where(eq(persons.id, personId));

    const updatedDheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, dheetoId),
    });

    sendSuccess(res, updatedDheeto, 201);
  } catch (err) {
    console.error(err);
    sendError(res, "Internal server error", 500);
  }
});

router.get<DheetoIdParams, GetTransactionsByDheetoIdResponse>("/dheeto/:dheetoId/transactions", async (req: Request, res: Response) => {
  try {
    const { dheetoId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    if (!isValidUUID(dheetoId)) return void sendError(res, "Invalid dheeto ID format", 400);

    const dheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, dheetoId),
    });
    if (!dheeto) return void sendError(res, "Dheeto not found", 404);

    const rows = await db.select().from(transactions).where(eq(transactions.dheetoId, dheetoId)).orderBy(transactions.createdAt).limit(limit).offset(offset);

    const allCount = await db.select().from(transactions).where(eq(transactions.dheetoId, dheetoId));

    const total = allCount.length;

    sendSuccess(res, {
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    sendError(res, "Internal server error", 500);
  }
});

router.put<TransactionIdParams, UpdateTransactionResponse, UpdateTransactionBody>("/dheeto/:dheetoId/transaction/:transactionId", async (req, res) => {
  try {
    const { dheetoId, transactionId } = req.params;
    const { type, amount, desc } = req.body;

    if (!isValidUUID(dheetoId) || !isValidUUID(transactionId)) return void sendError(res, "Invalid ID format", 400);

    const txUpdate: Partial<UpdateTransactionBody> = {};

    if (type !== undefined) {
      if (!["gave", "received"].includes(type)) return void sendError(res, "Invalid type", 400);
      txUpdate.type = type;
    }

    if (amount !== undefined) {
      if (amount <= 0) return void sendError(res, "Amount must be positive", 400);
      txUpdate.amount = amount;
    }

    if (desc !== undefined) txUpdate.desc = desc?.trim() || null;

    if (Object.keys(txUpdate).length === 0) return void sendError(res, "No valid fields to update", 400);

    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!existing) return void sendError(res, "Transaction not found", 404);
    if (existing.dheetoId !== dheetoId) return void sendError(res, "Transaction does not belong to this dheeto", 400);

    await db.update(transactions).set(txUpdate).where(eq(transactions.id, transactionId));

    const allTx = await db.select().from(transactions).where(eq(transactions.dheetoId, dheetoId));

    const newBalance = calculateBalance(allTx);

    await db.update(dheetos).set({ dheetoBalance: newBalance, updatedAt: new Date() }).where(eq(dheetos.id, dheetoId));

    const dheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, dheetoId),
    });

    const personId = dheeto!.personId;

    const allDheetos = await db.select().from(dheetos).where(eq(dheetos.personId, personId));

    const newTotal = allDheetos.reduce((sum, d) => sum + (d.dheetoBalance || 0), 0);

    await db.update(persons).set({ totalBalance: newTotal }).where(eq(persons.id, personId));

    const updatedDheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, dheetoId),
    });

    sendSuccess(res, updatedDheeto);
  } catch (err) {
    console.error(err);
    sendError(res, "Internal server error", 500);
  }
});

router.delete<TransactionIdParams, DeleteTransactionResponse>("/dheeto/:dheetoId/transaction/:transactionId", async (req, res) => {
  try {
    const { dheetoId, transactionId } = req.params;

    if (!isValidUUID(dheetoId) || !isValidUUID(transactionId)) return void sendError(res, "Invalid ID format", 400);

    const existing = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });

    if (!existing) return void sendError(res, "Transaction not found", 404);
    if (existing.dheetoId !== dheetoId) return void sendError(res, "Transaction does not belong to this dheeto", 400);

    await db.delete(transactions).where(eq(transactions.id, transactionId));

    const allTx = await db.select().from(transactions).where(eq(transactions.dheetoId, dheetoId));

    const newBalance = calculateBalance(allTx);

    await db.update(dheetos).set({ dheetoBalance: newBalance, updatedAt: new Date() }).where(eq(dheetos.id, dheetoId));

    const dheeto = await db.query.dheetos.findFirst({
      where: eq(dheetos.id, dheetoId),
    });

    const personId = dheeto!.personId;

    const allDheetos = await db.select().from(dheetos).where(eq(dheetos.personId, personId));

    const newTotal = allDheetos.reduce((sum, d) => sum + (d.dheetoBalance || 0), 0);

    await db.update(persons).set({ totalBalance: newTotal }).where(eq(persons.id, personId));

    sendSuccessMessage(res, "Transaction deleted successfully");
  } catch (err) {
    console.error(err);
    sendError(res, "Internal server error", 500);
  }
});

export default router;
