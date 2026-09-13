import { Worker } from "bullmq";
import { Prisma } from "@prisma/client";

import { redis } from "./config/redis.js";
import { prisma } from "./services/job.service.js";
import { processReport } from "./processors/report.processor.js";
import { processEmail } from "./processors/email.processor.js";
import { processFailureJob } from "./processors/failure.processor.js";
import { processNotificationCampaign } from "./processors/notification-campaign.processor.js";
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Job timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
const worker = new Worker(
  "jobs",

  async (queueJob) => {
    const { jobId, type, payload } = queueJob.data as {
      jobId: string;
      type: "report" | "email" | "failure" | "notification-campaign";
      payload: Record<string, unknown>;
    };

    console.log(`[WORKER] Processing job: ${jobId}`);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
        startedAt: new Date(),
      },
    });

    try {
      let result: Prisma.InputJsonValue;

      if (type === "report") {
        result = await withTimeout(
  processReport(payload),
  5000
);
      } else if (type === "email") {
       result = await withTimeout(
  processEmail(payload),
  5000
);
      }  else if (type === "notification-campaign") {
  result = await withTimeout(
    processNotificationCampaign(
      payload as {
        campaignName: string;
        recipients: string[];
        message: string;
      }
    ),
    15000
  );}else if (type === "failure") {
        await processFailureJob();

        throw new Error("Unreachable");
      } else {
        throw new Error(`Unknown job type: ${type}`);
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          result,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      console.log(`[WORKER] Job completed: ${jobId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      const attemptsMade = queueJob.attemptsMade + 1;

      const maxAttempts =
        typeof queueJob.opts.attempts === "number"
          ? queueJob.opts.attempts
          : 1;

      const isFinalAttempt =
        attemptsMade >= maxAttempts;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: isFinalAttempt
            ? "DEAD_LETTER"
            : "FAILED",
          errorMessage: message,
        },
      });

      console.error(
        `[WORKER] Job failed: ${jobId} attempt ${attemptsMade}/${maxAttempts}`
      );


      throw error;
    }
  },

  // Worker configuration
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on("failed", (job, error) => {
  console.error(
    `[WORKER] BullMQ failure for job: ${job?.id}`,
    error.message
  );
});

const shutdown = async () => {
  console.log("[WORKER] Shutting down...");

  await worker.close();
  await prisma.$disconnect();
  await redis.quit();

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[WORKER] AsyncFlow worker started");