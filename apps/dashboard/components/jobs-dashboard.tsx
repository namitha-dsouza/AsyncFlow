"use client";

import { useEffect, useMemo, useState } from "react";

type Job = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  errorMessage?: string | null;
};

export default function JobsDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("ALL");

  const [campaignName, setCampaignName] = useState("");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function refreshJobs() {
    try {
      const response = await fetch("/api/jobs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();

      setJobs(data);
    } catch (error) {
      console.error("Failed to refresh jobs:", error);
    }
  }

  async function submitCampaign(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError("");

    try {
      const recipientList = recipients
        .split("\n")
        .map((recipient) => recipient.trim())
        .filter(Boolean);

      if (recipientList.length === 0) {
        setSubmitError("Enter at least one recipient.");
        return;
      }

      const response = await fetch("/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "notification-campaign",
          payload: {
            campaignName,
            recipients: recipientList,
            message,
          },
          maxAttempts: 3,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Failed to create campaign"
        );
      }

      setCampaignName("");
      setRecipients("");
      setMessage("");

      await refreshJobs();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create campaign"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelJob(id: string) {
    try {
      const response = await fetch(`/api/jobs/${id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.message ?? "Failed to cancel job"
        );
      }

      await refreshJobs();
    } catch (error) {
      console.error("Failed to cancel job:", error);
    }
  }

  useEffect(() => {
    refreshJobs();

    const interval = setInterval(() => {
      refreshJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredJobs = useMemo(() => {
    if (filter === "ALL") {
      return jobs;
    }

    return jobs.filter((job) => job.status === filter);
  }, [jobs, filter]);

  const stats = {
    total: jobs.length,

    pending: jobs.filter(
      (job) => job.status === "PENDING"
    ).length,

    processing: jobs.filter(
      (job) => job.status === "PROCESSING"
    ).length,

    completed: jobs.filter(
      (job) => job.status === "COMPLETED"
    ).length,

    failed: jobs.filter(
      (job) => job.status === "FAILED"
    ).length,

    deadLetter: jobs.filter(
      (job) => job.status === "DEAD_LETTER"
    ).length,

    cancelled: jobs.filter(
      (job) => job.status === "CANCELLED"
    ).length,
  };

  const cards = [
    {
      label: "Total Jobs",
      value: stats.total,
    },
    {
      label: "Pending",
      value: stats.pending,
    },
    {
      label: "Processing",
      value: stats.processing,
    },
    {
      label: "Completed",
      value: stats.completed,
    },
    {
      label: "Failed",
      value: stats.failed,
    },
    {
      label: "Dead Letter",
      value: stats.deadLetter,
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
    },
  ];

  function statusClass(status: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400";

      case "PROCESSING":
        return "bg-blue-500/20 text-blue-400";

      case "FAILED":
        return "bg-red-500/20 text-red-400";

      case "DEAD_LETTER":
        return "bg-orange-500/20 text-orange-400";

      case "CANCELLED":
        return "bg-gray-500/20 text-gray-300";

      default:
        return "bg-yellow-500/20 text-yellow-300";
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            AsyncFlow Dashboard
          </h1>

          <p className="mt-2 text-gray-400">
            Distributed asynchronous job processing platform
          </p>
        </div>

        {/* Create Campaign Form */}

        <form
          onSubmit={submitCampaign}
          className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Create Notification Campaign
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Submit a notification campaign for asynchronous
              processing.
            </p>
          </div>

          <div className="grid gap-5">

            {/* Campaign name */}

            <div>
              <label
                htmlFor="campaignName"
                className="mb-2 block text-sm text-gray-300"
              >
                Campaign Name
              </label>

              <input
                id="campaignName"
                type="text"
                value={campaignName}
                onChange={(event) =>
                  setCampaignName(event.target.value)
                }
                required
                placeholder="AsyncFlow Launch"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 outline-none focus:border-gray-500"
              />
            </div>

            {/* Recipients */}

            <div>
              <label
                htmlFor="recipients"
                className="mb-2 block text-sm text-gray-300"
              >
                Recipients
              </label>

              <textarea
                id="recipients"
                value={recipients}
                onChange={(event) =>
                  setRecipients(event.target.value)
                }
                required
                rows={5}
                placeholder={`alice@example.com
bob@example.com
charlie@example.com`}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 outline-none focus:border-gray-500"
              />

              <p className="mt-2 text-xs text-gray-500">
                Enter one recipient per line.
              </p>
            </div>

            {/* Message */}

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm text-gray-300"
              >
                Message
              </label>

              <textarea
                id="message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                required
                rows={3}
                placeholder="AsyncFlow v1 has launched!"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 outline-none focus:border-gray-500"
              />
            </div>

            {/* Submit error */}

            {submitError && (
              <p className="text-sm text-red-400">
                {submitError}
              </p>
            )}

            {/* Submit button */}

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Campaign"}
              </button>
            </div>
          </div>
        </form>

        {/* Statistics */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5"
            >
              <p className="text-sm text-gray-400">
                {card.label}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {[
            "ALL",
            "PENDING",
            "PROCESSING",
            "COMPLETED",
            "FAILED",
            "DEAD_LETTER",
            "CANCELLED",
          ].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-2 text-sm ${
                filter === status
                  ? "bg-white text-black"
                  : "bg-gray-900 text-gray-300"
              }`}
            >
              {status}
            </button>
          ))}

          <button
            type="button"
            onClick={refreshJobs}
            className="ml-auto rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {/* Jobs Table */}

        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-left">

            <thead>
              <tr>
                <th className="p-4">
                  Job ID
                </th>

                <th className="p-4">
                  Type
                </th>

                <th className="p-4">
                  Status
                </th>

                <th className="p-4">
                  Attempts
                </th>

                <th className="p-4">
                  Created
                </th>

                <th className="p-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-t border-gray-800"
                >
                  <td className="p-4 font-mono text-sm">
                    {job.id.slice(0, 8)}...
                  </td>

                  <td className="p-4">
                    {job.type}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${statusClass(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </td>

                  <td className="p-4">
                    {job.attempts}/
                    {job.maxAttempts}
                  </td>

                  <td className="p-4 text-gray-400">
                    {new Date(
                      job.createdAt
                    ).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {job.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() =>
                          cancelJob(job.id)
                        }
                        className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredJobs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-gray-500"
                  >
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}