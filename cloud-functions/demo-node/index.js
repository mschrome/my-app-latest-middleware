// 云函数入口 - 使用 [[default]].js 模式捕获所有子路由
// 文件路径: cloud-functions/demo-node.js
// 访问路径: example.com/demo-node

export default function onRequest(context) {
  return new Response(getTestPageHTML(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function getTestPageHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node.js 云函数 - maxDuration 测试</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               background: linear-gradient(135deg, #68A063, #8CC84B); padding: 20px; min-height: 100vh; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h1 { color: #68A063; font-size: 28px; margin-bottom: 10px; }
        .header .subtitle { color: #666; font-size: 14px; }
        .config-info { background: #fff3cd; border: 1px solid #ffc107; border-radius: 12px; padding: 16px;
                       margin-bottom: 20px; font-size: 14px; color: #856404; }
        .config-info strong { color: #664d03; }
        .test-section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .test-section h3 { margin-bottom: 12px; color: #333; }
        .test-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px;
                    background: #f8f9fa; margin-bottom: 8px; flex-wrap: wrap; }
        .test-row:last-child { margin-bottom: 0; }
        .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 13px;
               cursor: pointer; font-weight: 600; transition: all 0.3s; white-space: nowrap; }
        .btn-green { background: #68A063; color: white; }
        .btn-green:hover { background: #5a8f56; }
        .btn-orange { background: #f57c00; color: white; }
        .btn-orange:hover { background: #e06800; }
        .btn-red { background: #d32f2f; color: white; }
        .btn-red:hover { background: #b71c1c; }
        .btn-blue { background: #1976d2; color: white; }
        .btn-blue:hover { background: #1565c0; }
        .label { font-size: 13px; color: #555; min-width: 120px; }
        .status { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .status-pending { background: #f5f5f5; color: #999; }
        .status-running { background: #fff3e0; color: #f57c00; animation: pulse 1s infinite; }
        .status-success { background: #e8f5e9; color: #388e3c; }
        .status-error { background: #ffebee; color: #d32f2f; }
        .status-timeout { background: #fff3e0; color: #e65100; }
        .result-box { margin-top: 8px; padding: 10px; background: #f5f5f5; border-radius: 6px;
                      font-family: monospace; font-size: 12px; white-space: pre-wrap;
                      max-height: 150px; overflow-y: auto; width: 100%; display: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🟢 Node.js 云函数 - maxDuration 测试</h1>
            <div class="subtitle">验证 edgeone.json 中 nodejs.maxDuration = 10 秒的配置</div>
        </div>

        <div class="config-info">
            ⚙️ 当前配置: <strong>nodejs.maxDuration = 5 秒</strong>
            <br>预期: sleep ≤ 5s 应正常返回，sleep > 5s 应被强制终止/超时
        </div>

        <div class="test-section">
            <h3>📋 基础功能</h3>
            <div class="test-row">
                <span class="label">函数信息</span>
                <button class="btn btn-blue" onclick="runBasic('/demo-node-api/info', 'basic-info')">GET /info</button>
                <span class="status status-pending" id="st-basic-info">待测试</span>
            </div>
            <div class="result-box" id="res-basic-info"></div>
            <div class="test-row">
                <span class="label">健康检查</span>
                <button class="btn btn-blue" onclick="runBasic('/demo-node-api/health', 'basic-health')">GET /health</button>
                <span class="status status-pending" id="st-basic-health">待测试</span>
            </div>
            <div class="result-box" id="res-basic-health"></div>
            <div class="test-row">
                <span class="label">当前时间</span>
                <button class="btn btn-blue" onclick="runBasic('/demo-node-api/time', 'basic-time')">GET /time</button>
                <span class="status status-pending" id="st-basic-time">待测试</span>
            </div>
            <div class="result-box" id="res-basic-time"></div>
        </div>

        <div class="test-section">
            <h3>⏱️ maxDuration 超时测试</h3>
            <div class="test-row">
                <span class="label">Sleep 3s (应通过)</span>
                <button class="btn btn-green" onclick="runSleep(3, 'sleep-3')">▶ 运行</button>
                <span class="status status-pending" id="st-sleep-3">待测试</span>
            </div>
            <div class="result-box" id="res-sleep-3"></div>
            <div class="test-row">
                <span class="label">Sleep 8s (应通过)</span>
                <button class="btn btn-orange" onclick="runSleep(8, 'sleep-8')">▶ 运行</button>
                <span class="status status-pending" id="st-sleep-8">待测试</span>
            </div>
            <div class="result-box" id="res-sleep-8"></div>
            <div class="test-row">
                <span class="label">Sleep 15s (应超时)</span>
                <button class="btn btn-red" onclick="runSleep(15, 'sleep-15')">▶ 运行</button>
                <span class="status status-pending" id="st-sleep-15">待测试</span>
            </div>
            <div class="result-box" id="res-sleep-15"></div>
            <div class="test-row">
                <span class="label">Sleep 25s (应超时)</span>
                <button class="btn btn-red" onclick="runSleep(25, 'sleep-25')">▶ 运行</button>
                <span class="status status-pending" id="st-sleep-25">待测试</span>
            </div>
            <div class="result-box" id="res-sleep-25"></div>
        </div>

        <div class="test-section">
            <h3>🚀 批量运行</h3>
            <div class="test-row">
                <button class="btn btn-green" onclick="runAllBasic()">运行所有基础测试</button>
                <button class="btn btn-orange" onclick="runAllSleep()">运行所有超时测试</button>
            </div>
        </div>
    </div>

    <script>
        async function runBasic(path, id) {
            var stEl = document.getElementById('st-' + id);
            var resEl = document.getElementById('res-' + id);
            stEl.className = 'status status-running';
            stEl.textContent = '运行中...';
            resEl.style.display = 'none';

            var start = Date.now();
            try {
                var r = await fetch(path);
                var elapsed = Date.now() - start;
                var text = await r.text();
                try { text = JSON.stringify(JSON.parse(text), null, 2); } catch(e) {}
                stEl.className = r.ok ? 'status status-success' : 'status status-error';
                stEl.textContent = r.ok ? '✅ ' + elapsed + 'ms' : '❌ HTTP ' + r.status;
                resEl.textContent = text;
                resEl.style.display = 'block';
            } catch(e) {
                stEl.className = 'status status-error';
                stEl.textContent = '❌ ' + e.message;
                resEl.textContent = e.message;
                resEl.style.display = 'block';
            }
        }

        async function runSleep(seconds, id) {
            var stEl = document.getElementById('st-' + id);
            var resEl = document.getElementById('res-' + id);
            stEl.className = 'status status-running';
            stEl.textContent = '⏳ sleeping ' + seconds + 's...';
            resEl.style.display = 'none';

            var start = Date.now();
            try {
                var controller = new AbortController();
                var timeout = setTimeout(function() { controller.abort(); }, (seconds + 20) * 1000);

                var r = await fetch('/demo-node-api/sleep?seconds=' + seconds, { signal: controller.signal });
                clearTimeout(timeout);
                var elapsed = Date.now() - start;
                var text = await r.text();
                try { text = JSON.stringify(JSON.parse(text), null, 2); } catch(e) {}

                if (r.ok && seconds <= 10) {
                    stEl.className = 'status status-success';
                    stEl.textContent = '✅ 正常返回 (' + (elapsed/1000).toFixed(1) + 's)';
                } else if (!r.ok && seconds > 10) {
                    stEl.className = 'status status-timeout';
                    stEl.textContent = '⏰ 被终止 (' + (elapsed/1000).toFixed(1) + 's) HTTP ' + r.status;
                } else if (r.ok && seconds > 5) {
                    stEl.className = 'status status-error';
                    stEl.textContent = '⚠️ 未超时! (' + (elapsed/1000).toFixed(1) + 's) - maxDuration 未生效';
                } else {
                    stEl.className = 'status status-error';
                    stEl.textContent = '❌ 意外结果 HTTP ' + r.status;
                }
                resEl.textContent = text;
                resEl.style.display = 'block';
            } catch(e) {
                var elapsed = Date.now() - start;
                if (seconds > 10) {
                    stEl.className = 'status status-timeout';
                    stEl.textContent = '⏰ 连接中断 (' + (elapsed/1000).toFixed(1) + 's) - 可能被 maxDuration 终止';
                } else {
                    stEl.className = 'status status-error';
                    stEl.textContent = '❌ ' + e.message;
                }
                resEl.textContent = '错误: ' + e.message + '\\n耗时: ' + (elapsed/1000).toFixed(1) + 's';
                resEl.style.display = 'block';
            }
        }

        async function runAllBasic() {
            await runBasic('/demo-node-api/info', 'basic-info');
            await runBasic('/demo-node-api/health', 'basic-health');
            await runBasic('/demo-node-api/time', 'basic-time');
        }

        async function runAllSleep() {
            await runSleep(3, 'sleep-3');
            await runSleep(8, 'sleep-8');
            await runSleep(15, 'sleep-15');
            await runSleep(25, 'sleep-25');
        }
    </script>
</body>
</html>`;
}
