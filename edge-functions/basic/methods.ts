// 测试所有 HTTP 方法的函数
export const onRequestGet = (context) => {
  return new Response(
    JSON.stringify({"method":"GET"}),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "GET",
      },
    }
  );
};

export const onRequestPost = (context) => {
  return new Response(
    JSON.stringify({"method":"POST"}),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "POST",
      },
    }
  );
};

export const onRequestPut = (context) => {
  return new Response(
    JSON.stringify({
      method: "PUT",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "PUT",
      },
    }
  );
};

export const onRequestPatch = (context) => {
  return new Response(
    JSON.stringify({
      method: "PATCH",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "PATCH",
      },
    }
  );
};

export const onRequestDelete = (context) => {
  return new Response(
    JSON.stringify({
      method: "DELETE",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "DELETE",
      },
    }
  );
};

export const onRequestHead = (context) => {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Test-Method": "HEAD",
      "X-Custom-Header": "HEAD request successful",
      "X-Timestamp": new Date().toISOString(),
    },
  });
};

export const onRequestOptions = (context) => {
  return new Response(
    JSON.stringify({
      method: "OPTIONS"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "OPTIONS",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
};

// 处理所有其他方法的通用处理器
export const onRequest = (context) => {
  const method = context.request.method;

  return new Response(
    JSON.stringify({
      method: 'FALLBACK'
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Test-Method": "ALL",
        "X-Actual-Method": method,
      },
    }
  );
};
