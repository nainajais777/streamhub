//videos.ts
import { Router } from "express";
import { db } from "../db/index.js";
import { videos, users } from "../db/schema.js";
import { eq, and, lt, desc } from "drizzle-orm";
import { requireAuth, requireCreator } from "../middleware/auth.js";
import {upload} from "../lib/upload.js";
export const videosRouter = Router();

videosRouter.get("/", async (req, res) => {
  const cursorParam = req.query.cursor as string | undefined;

  const whereConditions = [eq(videos.status, "ready")];
  if (cursorParam) {
    whereConditions.push(lt(videos.createdAt, new Date(cursorParam)));
  }

  const results = await db
    .select({
      id: videos.id,
      title: videos.title,
      createdAt: videos.createdAt,
      creatorUsername: users.username,
    })
    .from(videos)
    .innerJoin(users, eq(videos.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(desc(videos.createdAt))
    .limit(4);

 // const nextCursor = results.length > 0 ? results[results.length - 1].createdAt : null;
const nextCursor = results.length > 0 ? results[results.length - 1]!.createdAt : null;
  res.json({ videos: results, nextCursor });
});

videosRouter.get("/:id", async (req, res) => {
  const videoId = Number(req.params.id);

  const [video] = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      createdAt: videos.createdAt,
      creatorUsername: users.username,
    })
    .from(videos)
    .innerJoin(users, eq(videos.creatorId, users.id))
    .where(and(eq(videos.id, videoId), eq(videos.status, "ready")))
    .limit(1);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  res.json(video);
});

videosRouter.post("/", requireAuth, requireCreator, async (req: any, res) => {
  const { title, description, categoryId } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const [newVideo] = await db
    .insert(videos)
    .values({ creatorId: req.user.id, title, description, categoryId })
    .returning();

  res.status(201).json(newVideo);
});

videosRouter.post("/:id/upload", requireAuth, requireCreator, upload.single("video"), async (req: any, res) => {
  const videoId = Number(req.params.id);
  if(!req.file)
  {
    return res.status(400).json({error:"No file Uploaded"});
  }
  const [video]=await db.select().from(videos).where(eq(videos.id,videoId));
  if(!video)
  return res.status(404).json({error:"Video not found"});
  if(video.creatorId!== Number(req.user.id))
  {
    return res.status(403).json({error:"You can only upload your own videos"});
  }
  // req.file will contain info about the uploaded file, once multer processes it
  const [updated] = await db.update(videos).set({videoUrl:req.file.path}).where(eq(videos.id, videoId)).returning();
  res.status(200).json(updated);
  console.log(req.file); 
  res.json({ received: true });
});