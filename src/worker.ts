import "dotenv/config";
import { Worker } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import { db } from "./db/index.js";
import { videos } from "./db/schema.js";
import { eq } from "drizzle-orm";

const worker = new Worker(
  "video-transcode",
  async (job) => {
    const { videoId, filePath } = job.data;
    console.log(`Starting transcode for video ${videoId}...`);

    const outputPath = `uploads/${videoId}-transcoded.mp4`;

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    await db.update(videos).set({ status: "ready", videoUrl: outputPath }).where(eq(videos.id, videoId));
    console.log(`Video ${videoId} is now ready.`);
  },
  { connection: { host: "localhost", port: 6379 } }
);

worker.on("failed", (job, err) => {
  console.log(`Job for video ${job?.data.videoId} failed:`, err.message);
});

console.log("Worker started, waiting for transcode jobs...");