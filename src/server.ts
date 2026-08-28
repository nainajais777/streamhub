import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { videosRouter } from "./routes/videos.js";
import { followsRouter } from "./routes/follows.js";
import { subscriptionsRouter } from "./routes/subscription.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/videos", videosRouter);
app.use("/api/follows", followsRouter);
app.use("/api/subscriptions",subscriptionsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});