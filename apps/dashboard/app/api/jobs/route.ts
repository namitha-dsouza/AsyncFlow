export async function GET() {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/v1/jobs`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return Response.json(
        { message: "Failed to fetch jobs from AsyncFlow API" },
        { status: response.status }
      );
    }

    const jobs = await response.json();

    return Response.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);

    return Response.json(
      { message: "AsyncFlow API unavailable" },
      { status: 500 }
    );
  }
}