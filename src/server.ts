import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { videosRouter } from "./routes/videos.js";
import { followsRouter } from "./routes/follows.js";
import { subscriptionsRouter } from "./routes/subscription.js";
import{webhooksRouter} from "./routes/webhooks.js"; 
import { liveStreamsRouter } from "./routes/livestream.js";
import { commentsRouter } from "./routes/comments.js";
import { reactionsRouter } from "./routes/reactions.js";
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/webhooks", webhooksRouter);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/videos", videosRouter);
app.use("/api/follows", followsRouter);
app.use("/api/subscriptions",subscriptionsRouter);
app.use("/api/livestreams",liveStreamsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/reactions", reactionsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});