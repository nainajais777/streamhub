import { Queue } from "bullmq";

export const transcodeQueue = new Queue("video-transcode", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});