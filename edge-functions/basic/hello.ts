export function onRequest(context: { request: { method: string; headers: Record<string, string>; body: unknown } }) {
  return new Response("Hello, World from Edge Function!");
}