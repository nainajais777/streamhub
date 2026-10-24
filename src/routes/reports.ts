import { Router } from "express";
import { db } from "../db/index.js";
import { moderationReports } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.post("/", requireAuth, async (req: any, res) => {
  const { reportedUserId, reason, chatMessageId } = req.body;

  if (!reportedUserId || !reason || !String(reason).trim()) {
    return res.status(400).json({ error: "reportedUserId and reason are required" });
  }

  const reportedId = Number(reportedUserId);
  if (!Number.isInteger(reportedId)) {
    return res.status(400).json({ error: "reportedUserId must be a number" });
  }
  if (reportedId === Number(req.user.id)) {
    return res.status(400).json({ error: "You cannot report yourself" });
  }

  try {
    const [report] = await db
      .insert(moderationReports)
      .values({
        reporterId: Number(req.user.id),   
        reportedUserId: reportedId,
        chatMessageId: chatMessageId ? Number(chatMessageId) : null,
        reason: String(reason).trim(),
      })
      .returning();

    res.status(201).json(report);
  } catch (err: any) {
    const code = err.code || err.cause?.code;
    if (code === "23503") {
      return res.status(404).json({ error: "Reported user or chat message not found" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});