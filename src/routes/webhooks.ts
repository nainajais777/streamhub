import express, { Router } from 'express';
import { db } from '../db/index.js';
import { subscriptions, payments, creatorProfiles, pendingCheckouts } from "../db/schema.js";
import crypto from 'crypto';
import { eq ,sql} from "drizzle-orm";


export const webhooksRouter = Router();
webhooksRouter.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
try{
const rawBody=req.body;
const receivedSignature=req.headers['x-razorpay-signature'];
const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
const expectedSignature=crypto.createHmac('sha256',secret!).update(rawBody).digest('hex');
if(expectedSignature!==receivedSignature){
    return res.status(400).json({ error: "Invalid signature" });
}
const event=JSON.parse(rawBody.toString());
const orderId=event.payload.order_id;

const [pending]=await db.select().from(pendingCheckouts).where(eq(pendingCheckouts.orderId,orderId));
if (!pending) {
  return res.status(404).json({ error: "Order not found" });
}

await db.transaction(async (tx) => {
    const renewsAt = new Date();
    renewsAt.setDate(renewsAt.getDate() + 30);

    await tx.insert(subscriptions).values({
      subscriberId: pending.subscriberId,
      creatorId: pending.creatorId,
      renewsAt,
    });

    await tx.insert(payments).values({
      payerId: pending.subscriberId,
      payeeId: pending.creatorId,
      type: "subscription_charge",
      amountCents: 50000,
      status: "succeeded",
      gatewayEventId: orderId,
    });

    await tx
      .update(creatorProfiles)
      .set({ totalEarningsCents: sql`${creatorProfiles.totalEarningsCents} + 50000` })
      .where(eq(creatorProfiles.userId, pending.creatorId));

    await tx
      .update(pendingCheckouts)
      .set({ status: "completed" })
      .where(eq(pendingCheckouts.orderId, orderId));
  });


res.status(200).json({ received: true });
}
catch(err:any){
    console.log("webhook error",err);
    res.status(500).json({error:"Something went wrong"});

}




})
