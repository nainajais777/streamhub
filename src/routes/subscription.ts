import { Router } from "express";
import { db } from "../db/index.js";
import { subscriptions, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireTargetIsCreator } from "../middleware/auth.js";
export const subscriptionsRouter = Router();

subscriptionsRouter.post("/", requireAuth, requireTargetIsCreator, async (req: any, res) => {
  // 1. calculate renewsAt (30 days from now) — you already have this line
  // 2. insert into subscriptions — which fields, from where?
  // 3. handle the duplicate case (remember UNIQUE(subscriberId, creatorId) — same error code as follows)
  // 4. respond
const renewsAt = new Date();
renewsAt.setDate(renewsAt.getDate() + 30);
try{
 const [newSubscription] = await db
      .insert(subscriptions)
      .values({ subscriberId: req.user.id, creatorId: req.body.creatorId, renewsAt })
      .returning();
      console.log("newSubscription:", newSubscription);
      res.status(201).json(newSubscription);
}
 catch (err: any) {
  if (err.code === "23505" || err.cause?.code === "23505") {
    return res.status(409).json({ error: "Already subscribed to this creator" });
  }
  res.status(500).json({ error: "Something went wrong" });
}
});