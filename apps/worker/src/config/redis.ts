import "dotenv/config";
import { Redis } from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }
);

redis.on("connect", () => {
  console.log("[REDIS] Connected");
});

redis.on("ready", () => {
  console.log("[REDIS] Ready");
});

redis.on("error", (error: Error) => {
  console.error("[REDIS] Error:", error.message);
});