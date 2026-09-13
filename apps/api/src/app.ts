import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { jobsController } from "./modules/jobs/jobs.controller.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  await app.register(healthRoutes);
  await app.register(jobsController);

  return app;
}