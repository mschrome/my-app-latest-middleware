// 测试 maxDuration: sleep 15s，超过 edgeone.json 中配置的 10s 限制
export default async function onRequest() {
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 14000));
  return new Response(JSON.stringify({ elapsed: Date.now() - start }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
