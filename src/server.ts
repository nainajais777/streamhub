import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000", // baad mein frontend yahan chalega
  credentials: true,
}));

// Better Auth apne saare routes (signup, login, logout, session) khud handle karega
//app.all("/api/auth/*", toNodeHandler(auth));
app.all("/api/auth/*splat", toNodeHandler(auth));

// baaki saare routes ke liye JSON parsing chahiye (auth routes ke baad, ye order important hai)
app.use(express.json());




app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

import { db } from "./db";
import { videos, users } from "./db/schema";
import { eq, and, lt, desc } from "drizzle-orm";

app.get("/api/videos", async (req, res) => {
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

  const nextCursor = results.length > 0 ? results[results.length - 1].createdAt : null;

  res.json({ videos: results, nextCursor });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});