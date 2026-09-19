import {Router} from "express";
import {db} from "../db/index.js";
import {liveStreams} from "../db/schema.js";
import {requireAuth,requireCreator} from "../middleware/auth.js";
import { eq } from "drizzle-orm";
export const liveStreamsRouter = Router();

liveStreamsRouter.post("/", requireAuth, requireCreator, async (req: any, res) => {
 if(!req.body.title)
 {
    return res.status(400).json({error : "Title is required"});
 }
    try {
    const [newStream] = await db
      .insert(liveStreams)
      .values({ creatorId: req.user.id, title: req.body.title })
      .returning();
    res.status(201).json(newStream);
  } catch (err: any) {
    if(err.code ==="23505" || err.cause?.code === "23505")
    {
        return res.status(409).json({error :"You are already live streaming"});
    }
res.status(500).json({error : "Something went wrong"});  
  }
});

liveStreamsRouter.patch("/:id/end", requireAuth, requireCreator, async (req: any, res) => {
  const streamId = Number(req.params.id);

  const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, streamId));

  if (!stream) {
    return res.status(404).json({ error: "Stream not found" });
  }

  if (stream.creatorId !== Number(req.user.id)) {
    return res.status(403).json({ error: "You can only end your own stream" });
  }

  const [updated] = await db
    .update(liveStreams)
    .set({ status: "ended", endedAt: new Date() })
    .where(eq(liveStreams.id, streamId))
    .returning();

  res.status(200).json(updated);
});