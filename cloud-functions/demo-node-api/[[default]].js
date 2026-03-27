// 云函数 API 路由 - catch-all 模式
// 文件路径: cloud-functions/demo-node-api/[[default]].js
// 匹配路径: example.com/demo-node-api/*

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 从路径中提取子路由: /demo-node-api/info -> /info
  const prefix = '/demo-node-api';
  let subPath = path;
  if (path.startsWith(prefix)) {
    subPath = path.slice(prefix.length) || '/';
  }

  // 路由分发
  switch (subPath) {
    case '/':
    case '':
      return jsonResponse({
        name: 'Node.js Cloud Function API',
        runtime: 'Node.js',
        description: '用于测试 maxDuration 配置的 Node.js 云函数',
        maxDuration: '5s (configured in edgeone.json)',
        routes: ['/info', '/health', '/time', '/sleep?seconds=N'],
      });

    case '/info':
      return jsonResponse({
        name: 'Node.js Cloud Function Demo',
        runtime: 'Node.js',
        description: '用于测试 maxDuration 配置的 Node.js 云函数',
        maxDuration: '5s (configured in edgeone.json)',
      });

    case '/health':
      return jsonResponse({
        status: 'healthy',
        timestamp: Math.floor(Date.now() / 1000),
        type: 'nodejs_function',
      });

    case '/time': {
      const now = new Date();
      return jsonResponse({
        timestamp: Date.now() / 1000,
        iso: now.toISOString(),
        formatted: now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
      });
    }

    case '/sleep': {
      // 超时测试路由 - 核心验证 maxDuration
      let seconds = parseInt(url.searchParams.get('seconds')) || 5;
      if (seconds < 1) seconds = 1;
      if (seconds > 120) seconds = 120;

      console.log(`[SLEEP] Starting sleep for ${seconds} seconds...`);
      const startTime = Date.now();

      // 使用 Promise + setTimeout 实现 sleep
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[SLEEP] Woke up after ${elapsed} seconds`);

      return jsonResponse({
        message: `Slept for ${seconds} seconds`,
        requested_sleep: seconds,
        actual_elapsed: `${elapsed}s`,
        max_duration: '5s (configured in edgeone.json)',
        within_limit: seconds <= 5,
      });
    }

    default:
      return jsonResponse({ error: 'Not Found', path: subPath }, 404);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
