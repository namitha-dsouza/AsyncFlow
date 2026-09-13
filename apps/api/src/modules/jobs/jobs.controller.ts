import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { z } from "zod";
import { createJobSchema } from "./jobs.schema.js";
import { JobService } from "./jobs.service.js";

export async function jobsController(app: FastifyInstance) {
  const queue = new Queue("jobs", {
    connection: app.redis,
  });

  const service = new JobService(app.prisma, queue);

  app.post("/api/v1/jobs", async (request, reply) => {
    const input = createJobSchema.parse(request.body);
    const job = await service.create(input);

    return reply.code(201).send({
      id: job.id,
      status: job.status,
    });
  });

  app.get("/api/v1/jobs", async () => {
    return app.prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });
  });

  app.get("/api/v1/jobs/:id", async (request, reply) => {
    const { id } = z.object({
      id: z.string().uuid(),
    }).parse(request.params);

    const job = await app.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return reply.code(404).send({
        message: "Job not found",
      });
    }

    return job;
  });

  app.post("/api/v1/jobs/:id/cancel", async (request, reply) => {
    const { id } = z.object({
      id: z.string().uuid(),
    }).parse(request.params);

    try {
      const job = await service.cancel(id);

      return reply.send({
        id: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      return reply.code(400).send({
        message,
      });
    }
  });

  app.addHook("onClose", async () => {
    await queue.close();
  });
}