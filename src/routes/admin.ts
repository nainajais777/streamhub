import { Router } from "express";
import { db } from "../db/index.js";
//import { moderationReports } from "../db/schema.js";
//import { eq, and, desc } from "drizzle-orm";
import { moderationReports, platformBans, users, sessions } from "../db/schema.js";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const VALID_STATUSES = ["pending", "reviewed", "dismissed"];

adminRouter.get("/reports", async (req, res) => {
  const status = req.query.status as string | undefined;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status filter" });
  }

  const reports = await db
    .select()
    .from(moderationReports)
    .where(status ? eq(moderationReports.status, status as any) : undefined)
    .orderBy(desc(moderationReports.createdAt))
    .limit(50);

  res.json(reports);
});

adminRouter.patch("/reports/:id", async (req: any, res) => {
  const reportId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ error: "Invalid report id" });
  }
  if (status !== "reviewed" && status !== "dismissed") {
    return res.status(400).json({ error: "status must be 'reviewed' or 'dismissed'" });
  }

  const [report] = await db
    .select()
    .from(moderationReports)
    .where(eq(moderationReports.id, reportId));

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  const [updated] = await db
    .update(moderationReports)
    .set({ status, reviewedBy: Number(req.user.id) })
    .where(and(eq(moderationReports.id, reportId), eq(moderationReports.status, "pending")))
    .returning();

  if (!updated) {
    return res.status(409).json({ error: "Report already handled" });
  }

  res.json(updated);
});
adminRouter.post("/bans", async (req: any, res) => {
  const { userId, reason } = req.body;
  const targetId = Number(userId);

  if (!Number.isInteger(targetId) || !reason || !String(reason).trim()) {
    return res.status(400).json({ error: "userId (number) and reason are required" });
  }
  if (targetId === Number(req.user.id)) {
    return res.status(400).json({ error: "You cannot ban yourself" });
  }

  const [target] = await db.select().from(users).where(eq(users.id, targetId));
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  if (target.role === "admin") {
    return res.status(400).json({ error: "Admins cannot be banned" });
  }

  try {
    const ban = await db.transaction(async (tx) => {
      const [newBan] = await tx
        .insert(platformBans)
        .values({
          userId: targetId,
          bannedBy: Number(req.user.id),
          reason: String(reason).trim(),
        })
        .returning();

      await tx.update(users).set({ isSuspended: true }).where(eq(users.id, targetId));
      await tx.delete(sessions).where(eq(sessions.userId, targetId));

      return newBan;
    });

    res.status(201).json(ban);
  } catch (err: any) {
    const code = err.code || err.cause?.code;
    if (code === "23505") {
      return res.status(409).json({ error: "User is already banned" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

adminRouter.patch("/bans/:id/lift", async (req: any, res) => {
  const banId = Number(req.params.id);
  if (!Number.isInteger(banId)) {
    return res.status(400).json({ error: "Invalid ban id" });
  }

  const [ban] = await db.select().from(platformBans).where(eq(platformBans.id, banId));
  if (!ban) {
    return res.status(404).json({ error: "Ban not found" });
  }

  const lifted = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(platformBans)
      .set({ liftedAt: new Date() })
      .where(and(eq(platformBans.id, banId), isNull(platformBans.liftedAt)))
      .returning();

    if (!updated) return null;   // kisi aur ne pehle hi hata diya

    await tx.update(users).set({ isSuspended: false }).where(eq(users.id, ban.userId));
    return updated;
  });

  if (!lifted) {
    return res.status(409).json({ error: "Ban already lifted" });
  }
  res.json(lifted);
});