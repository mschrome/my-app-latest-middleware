import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

// 辅助函数：克隆请求以避免 body 被消费的问题
async function cloneRequestWithBody(req: Request): Promise<Request> {
  // 如果是 GET/HEAD 请求，不需要处理 body
  if (req.method === "GET" || req.method === "HEAD") {
    return req;
  }
  
  try {
    // 尝试读取 body
    const body = await req.text();
    console.log("[Auth Debug] Request body:", body || "<empty>");
    
    // 用读取到的 body 创建新的 Request
    return new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: body || undefined,
    });
  } catch (e) {
    console.error("[Auth Debug] Failed to read body:", e);
    return req;
  }
}

export const GET = async (req: Request) => {
  console.log("[Auth GET] URL:", req.url);
  console.log("[Auth GET] Headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    const response = await handler.GET(req);
    console.log("[Auth GET] Response status:", response.status);
    console.log("[Auth GET] Response headers:", Object.fromEntries(response.headers.entries()));
    return response;
  } catch (error) {
    console.error("[Auth GET Error]", error);
    const err = error as Error;
    return new Response(JSON.stringify({ 
      error: err.message || String(error),
      stack: err.stack 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST = async (req: Request) => {
  console.log("[Auth POST] URL:", req.url);
  
  try {
    // 重建请求以确保 body 可读
    const newReq = await cloneRequestWithBody(req);
    const response = await handler.POST(newReq);
    console.log("[Auth POST] Response status:", response.status);
    return response;
  } catch (error) {
    console.error("[Auth POST Error]", error);
    const err = error as Error;
    return new Response(JSON.stringify({ 
      error: err.message || String(error),
      stack: err.stack 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
