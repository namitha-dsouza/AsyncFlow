export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const response = await fetch(
    `${process.env.API_URL}/api/v1/jobs/${id}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    }
  );

  const data = await response.json();

  return Response.json(data, {
    status: response.status,
  });
}