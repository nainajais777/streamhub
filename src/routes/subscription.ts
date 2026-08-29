import { Router } from "express";
import { db } from "../db/index.js";
import { subscriptions, users } from "../db/schema.js";
import {razorpay } from "../lib/razorpay.js";
import { eq } from "drizzle-orm";
import { requireAuth, requireTargetIsCreator } from "../middleware/auth.js";
export const subscriptionsRouter = Router();

subscriptionsRouter.post("/", requireAuth, requireTargetIsCreator, async (req: any, res) => {
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

subscriptionsRouter.post("/checkout", requireAuth, requireTargetIsCreator, async (req: any, res) => {
  try{
    const order = await razorpay.orders.create({
      amount: 50000, // amount in paise
      currency: "INR",
      receipt: `sub_${req.user.id}_${req.body.creatorId}_${Date.now()}`,
    });
    res.status(201).json(order);
  }catch (err: any) {
    console.log("RAZORPAY ORDER ERROR:", err);
    res.status(500).json({ error: "Something went wrong" });
  }

});