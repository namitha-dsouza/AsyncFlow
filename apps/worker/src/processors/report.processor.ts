export async function processReport(payload: Record<string, unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    message: "Report processed",
    reportName: payload.name ?? null,
  };
}