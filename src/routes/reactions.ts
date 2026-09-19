import { Router } from "express";
import { db } from "../db/index.js";
import { reactions } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const reactionsRouter = Router();

reactionsRouter.post("/", requireAuth, async (req: any, res) => {
  const { videoId, liveStreamId, type } = req.body;
  const hasVideo = videoId !== undefined && videoId !== null;
  const hasStream = liveStreamId !== undefined && liveStreamId !== null;

  if (hasVideo === hasStream) {
    return res.status(400).json({ error: "Provide exactly one of videoId or liveStreamId" });
  }
  if (!type) {
    return res.status(400).json({ error: "type is required" });
  }

  try {
    const [reaction] = await db
      .insert(reactions)
      .values({
        userId: req.user.id,
        videoId: hasVideo ? videoId : null,
        liveStreamId: hasStream ? liveStreamId : null,
        type,
      })
      .onConflictDoUpdate({
        target: hasVideo ? [reactions.userId, reactions.videoId] : [reactions.userId, reactions.liveStreamId],
        set: { type },
      })
      .returning();

    res.status(201).json(reaction);
  } catch (err: any) {
    if (err.code === "23514" || err.cause?.code === "23514") {
      return res.status(400).json({ error: "Invalid target" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});