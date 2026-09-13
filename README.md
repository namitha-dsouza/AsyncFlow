# AsyncFlow
AsyncFlow is a distributed asynchronous job processing platform built with TypeScript, Fastify, PostgreSQL, Redis, and BullMQ.

🧠 Problem

Modern applications require reliable asynchronous task execution. AsyncFlow provides a scalable job processing system with retries, dead-letter queues, and idempotency support.


## Architecture

Client → Fastify API → PostgreSQL + Redis/BullMQ → Worker → PostgreSQL

## Day 1 goal

Create a job through the API, enqueue it, process it in a separate worker, and persist the completed result.

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
```

Run the API:

```bash
npm run dev:api
```

Run the worker in another terminal:

```bash
npm run dev:worker
```

## Test

```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"report","payload":{"name":"monthly-sales"}}'
```

Then fetch the returned job ID:

```bash
curl http://localhost:3000/api/v1/jobs/<JOB_ID>
```

