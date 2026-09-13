AsyncFlow is a distributed asynchronous job processing platform built to demonstrate reliable background job execution, retries, idempotency, concurrency, cancellation, dead-letter handling, and real-time job monitoring.

Instead of performing long-running work inside HTTP requests, AsyncFlow persists jobs in PostgreSQL, queues them through BullMQ and Redis, and processes them independently using a background worker.

## Live Demo

**Dashboard:** [YOUR_VERCEL_DASHBOARD_URL](https://async-flow-dashboard.vercel.app/)

**API:** https://asyncflow-api-e157.onrender.com

## Architecture

```text
Next.js Dashboard
       |
       v
   Fastify API
       |
       +------> PostgreSQL
       |          (Neon)
       |
       v
 BullMQ Queue
       |
       v
     Redis
    (Upstash)
       |
       v
 Background Worker
       |
       v
 Job Processing
```

## Features

- Asynchronous background job processing
- PostgreSQL-backed job persistence
- BullMQ + Redis job queue
- Independent worker processing
- Exponential retry and backoff
- Dead-letter handling after maximum retry attempts
- Idempotency keys to prevent duplicate job creation
- Configurable job priority
- Worker concurrency
- Job execution timeouts
- Queued-job cancellation
- Job status tracking
- Dashboard with automatic status refresh
- Notification campaign demo workload

## Job Lifecycle

Jobs move through states such as:

```text
PENDING → PROCESSING → COMPLETED
                     ↘ FAILED → Retry
                                ↘ DEAD_LETTER
```

Queued jobs can also be moved to:

```text
CANCELLED
```

## Notification Campaign Demo

The dashboard allows a notification campaign to be submitted with:

- Campaign name
- Recipient list
- Message

The API persists the job and publishes it to the queue. The worker consumes the job asynchronously and processes each recipient while the dashboard tracks the job's status.

The external notification provider is intentionally simulated in the demo. The processor boundary can be replaced with an email, SMS, or other notification provider without changing the core queue architecture.

## Tech Stack

**Backend**
- Node.js
- TypeScript
- Fastify
- BullMQ
- Redis / Upstash
- PostgreSQL / Neon
- Prisma

**Frontend**
- Next.js
- React
- TypeScript

**Deployment**
- Vercel
- Render
- Neon
- Upstash

## Reliability Features

### Retries & Exponential Backoff

Failed jobs are automatically retried using BullMQ with exponential backoff. Once the configured maximum number of attempts is reached, the job is marked as `DEAD_LETTER`.

### Idempotency

Clients can provide an idempotency key when creating a job. Repeated submissions with the same key return the existing job rather than creating duplicate work.

### Concurrency

The worker processes multiple jobs concurrently while queueing additional work through Redis.

### Cancellation

Pending jobs can be cancelled before processing. The worker also checks persisted job state as part of the processing lifecycle.

### Timeouts

Job processors are executed with configured time limits to prevent jobs from occupying worker capacity indefinitely.

## Running Locally

### Prerequisites

- Node.js
- npm
- Docker

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate
```

Start the API:

```bash
npm run dev:api
```

Start the worker in another terminal:

```bash
npm run dev:worker
```

Start the dashboard from its workspace.

## Environment Variables

Create local environment files using `.env.example` as a reference.

```env
DATABASE_URL=
REDIS_URL=
PORT=3000
```
