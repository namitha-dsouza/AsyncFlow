export async function processEmail(payload: Record<string, unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    message: "Email processed",
    to: payload.to ?? null,
  };
}