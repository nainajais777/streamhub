import crypto from "crypto";
import "dotenv/config";

const body = JSON.stringify({
  event: "payment.captured",
  payload: { order_id: "order_TbZ4S7bl7QQS1w", status: "paid" }
});

const signature = crypto
  .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

console.log("BODY:", body);
console.log("SIGNATURE:", signature);

