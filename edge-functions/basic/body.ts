/**
 * Vercel 兼容的 request.body 测试函数
 * 测试所有 Vercel 支持的 Content-Type 解析规则
 */

interface RequestContext {
  request: {
    method: string;
    headers: Record<string, string>;
    body: unknown;
  };
}

export async function onRequestPost(context: RequestContext) {
  const { request } = context;

  try {
    console.log("=== Body Test ===");
    console.log("Method:", request.method);
    console.log("Content-Type:", request.headers["content-type"]);
    console.log("Content-Length:", request.headers["content-length"]);

    // 分析 body 属性
    const body = request.body;
    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
