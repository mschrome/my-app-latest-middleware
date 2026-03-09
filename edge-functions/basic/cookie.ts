export async function onRequest(context: { request: { method: string; headers: Record<string, string>; body: unknown } }) {
  const { request } = context;
  const cookies = request.cookies;
  return new Response(
    JSON.stringify(cookies),
    {
      status: 200,
    }
  );
}