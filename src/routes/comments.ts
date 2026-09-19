import { Router } from "express";
import { db } from "../db/index.js";
import { comments } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

export const commentsRouter = Router();

// GET /api/comments?videoId=101 — public, list comments on a video
commentsRouter.get("/", async (req, res) => {
  const videoId = Number(req.query.videoId);
  const results = await db.select().from(comments)
    .where(and(eq(comments.videoId, videoId), eq(comments.isDeleted, false)))
    .orderBy(desc(comments.createdAt));
  res.json(results);
});

// POST /api/comments — any logged-in user can comment
commentsRouter.post("/", requireAuth, async (req: any, res) => {
  if (!req.body.videoId || !req.body.content) {
    return res.status(400).json({ error: "videoId and content are required" });
  }
  const [newComment] = await db.insert(comments).values({
    videoId: req.body.videoId,
    userId: req.user.id,
    content: req.body.content,
  }).returning();
  res.status(201).json(newComment);
});

// DELETE /api/comments/:id — only the comment's own author can delete (soft delete)
commentsRouter.delete("/:id", requireAuth, async (req: any, res) => {
  const commentId = Number(req.params.id);
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));

  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.userId !== Number(req.user.id)) return res.status(403).json({ error: "You can only delete your own comment" });

  await db.update(comments).set({ isDeleted: true }).where(eq(comments.id, commentId));
  res.status(200).json({ deleted: true });
});