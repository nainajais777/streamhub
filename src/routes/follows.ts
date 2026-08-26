import { Router } from "express";
import { db } from "../db/index.js";
import { follows } from "../db/schema.js";
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