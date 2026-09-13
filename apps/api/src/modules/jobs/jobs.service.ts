import { PrismaClient, Prisma } from "@prisma/client";
import { Queue } from "bullmq";
import type { CreateJobInput } from "./jobs.schema.js";

export class JobService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly queue: Queue,
  ) {}

  async create(input: CreateJobInput) {
    if (input.idempotencyKey) {
      const existingJob = await this.prisma.job.findUnique({
        where: {
          idempotencyKey: input.idempotencyKey,
        },
      });

      if (existingJob) {
        return existingJob;
      }
    }

    const job = await this.prisma.job.create({
      data: {
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
        maxAttempts: input.maxAttempts ?? 3,
        priority: input.priority ?? 0,
        scheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : undefined,
        idempotencyKey: input.idempotencyKey,
      },
    });

    await this.queue.add(
  job.type,
  {
    jobId: job.id,
    type: job.type,
    payload: job.payload,
  },
  {
    jobId: job.id,
    priority: Math.max(1, 100 - job.priority),
    attempts: job.maxAttempts,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
);

    return job;
  }

  async cancel(jobId: string) {
  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.status === "CANCELLED") {
    return job;
  }


  if (
    job.status === "COMPLETED" ||
    job.status === "DEAD_LETTER"
  ) {
    throw new Error(`Cannot cancel job with status ${job.status}`);
  }

  const queueJob = await this.queue.getJob(jobId);

  if (queueJob) {
    await queueJob.remove();
  }

  return this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      errorMessage: "Job cancelled by user",
    },
  });
}
}