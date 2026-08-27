import { Router } from "express";
import { db } from "../db/index.js";
import { follows,users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireTargetIsCreator } from "../middleware/auth.js";

export const followsRouter = Router();
followsRouter.post("/", requireAuth, requireTargetIsCreator, async (req: any, res) => {
  try {
    const [newFollow] = await db
      .insert(follows)
      .values({ followerId: req.user.id, creatorId: req.body.creatorId })
      .returning();

    res.status(201).json(newFollow);
  } catch (err: any) {
  console.log("ACTUAL ERROR OBJECT:", err);
  console.log("err.code:", err.code);
  console.log("err.cause?.code:", err.cause?.code);
  
  if (err.code === "23505" || err.cause?.code === "23505") {
    return res.status(409).json({ error: "Already following this creator" });
  }
  res.status(500).json({ error: "Something went wrong" });
}
});
followsRouter.get("/:creatorId/followers", async (req, res) => {
  try {
    const creatorId = Number(req.params.creatorId);

    const followers = await db
      .select({ followerId: follows.followerId, username: users.username })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.creatorId, creatorId));

    res.json({ followers, count: followers.length });
  } catch (err: any) {
    console.log("FOLLOWERS ERROR:", err);
    console.log("CAUSE:", err.cause);
    res.status(500).json({ error: "Something went wrong" });
  }
});

followsRouter.get("/:userId/following", requireAuth, async (req: any, res) => {
  const targetId = Number(req.params.userId);

  if (Number(req.user.id) !== targetId) {
    return res.status(403).json({ error: "You can only view your own following list" });
  }

  const following = await db
    .select({ creatorId: follows.creatorId, username: users.username })
    .from(follows)
    .innerJoin(users, eq(follows.creatorId, users.id))
    .where(eq(follows.followerId, targetId));

  res.json({ following, count: following.length });
});