export async function onRequest(context: { request: { method: string; headers: Record<string, string>; body: unknown } }) {
  const { request } = context;
  const query = request.query;
  return new Response(
    JSON.stringify(query),
    {
      status: 200,
    }
  );
}