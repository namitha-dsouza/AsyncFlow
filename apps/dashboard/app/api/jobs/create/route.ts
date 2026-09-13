export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.API_URL}/api/v1/jobs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to create job:", error);

    return Response.json(
      {
        message: "Failed to create job",
      },
      {
        status: 500,
      }
    );
  }
}