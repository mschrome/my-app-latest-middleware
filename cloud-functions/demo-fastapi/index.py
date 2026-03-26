"""
精确匹配 /demo-fastapi 的入口 - 返回静态测试页面
使用纯 handler 函数模式，不导出任何框架 app 对象
"""

HTML_PAGE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FastAPI 框架测试</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               padding: 20px; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h1 { color: #009688; font-size: 32px; margin-bottom: 10px; }
        .header .version { color: #666; font-size: 14px; }
        .controls { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px;
               cursor: pointer; transition: all 0.3s; font-weight: 600; }
        .btn-primary { background: #009688; color: white; }
        .btn-primary:hover { background: #00796b; transform: translateY(-2px); }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-secondary:hover { background: #e0e0e0; }
        .stats { display: flex; gap: 15px; margin-left: auto; font-size: 14px; flex-wrap: wrap; }
        .stat { padding: 8px 16px; border-radius: 6px; font-weight: 600; }
        .stat-total { background: #e3f2fd; color: #1976d2; }
        .stat-pass { background: #e8f5e9; color: #388e3c; }
        .stat-fail { background: #ffebee; color: #d32f2f; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        .test-card { background: white; border-radius: 12px; padding: 20px;
                     box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s; }
        .test-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.15); transform: translateY(-4px); }
        .test-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .test-icon { width: 32px; height: 32px; border-radius: 8px; display: flex;
                     align-items: center; justify-content: center; font-size: 18px;
                     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .test-title { font-size: 16px; font-weight: 700; color: #333; flex: 1; }
        .test-method { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .method-GET { background: #e3f2fd; color: #1976d2; }
        .method-POST { background: #fff3e0; color: #f57c00; }
        .method-PUT { background: #f3e5f5; color: #7b1fa2; }
        .method-DELETE { background: #ffebee; color: #c62828; }
        .test-desc { color: #666; font-size: 13px; margin-bottom: 12px; line-height: 1.5; }
        .test-url { background: #f5f5f5; padding: 10px; border-radius: 6px; font-family: 'Courier New', monospace;
                    font-size: 12px; color: #333; margin-bottom: 12px; word-break: break-all; }
        .test-status { padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
                       display: inline-flex; align-items: center; gap: 6px; }
        .status-pending { background: #f5f5f5; color: #999; }
        .status-running { background: #fff3e0; color: #f57c00; animation: pulse 1.5s infinite; }
        .status-success { background: #e8f5e9; color: #388e3c; }
        .status-error { background: #ffebee; color: #d32f2f; }
        .test-result { margin-top: 12px; padding: 12px; border-radius: 6px; font-size: 12px;
                       background: #f9f9f9; max-height: 200px; overflow-y: auto; font-family: monospace; }
        .test-time { color: #666; font-size: 11px; margin-top: 8px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FastAPI 框架测试</h1>
            <div class="version">Version: 0.100.0+ | EdgeOne Pages Python Cloud Functions</div>
        </div>

        <div class="controls">
            <button class="btn btn-primary" onclick="runAllTests()">▶ 运行所有测试</button>
            <button class="btn btn-secondary" onclick="clearResults()">🔄 清除结果</button>
            <div class="stats">
                <div class="stat stat-total">总数: <span id="total">0</span></div>
                <div class="stat stat-pass">通过: <span id="passed">0</span></div>
                <div class="stat stat-fail">失败: <span id="failed">0</span></div>
            </div>
        </div>

        <div class="test-grid" id="testGrid"></div>
    </div>

    <script>
        const B = "/demo-fastapi";
        const tests = [
            { id: 1, name: "健康检查", method: "GET", path: B + "/health", desc: "服务健康状态", check: "healthy" },
            { id: 2, name: "获取用户", method: "GET", path: B + "/users/1", desc: "通过 ID 获取用户信息", check: "user_" },
            { id: 3, name: "搜索功能", method: "GET", path: B + "/search?q=test", desc: "搜索 API", check: "query" },
            { id: 4, name: "创建商品", method: "POST", path: B + "/items", desc: "POST 创建商品", body: {name: "测试商品", price: 99.9, description: "测试描述", tags: ["test"]}, check: "id" },
            { id: 5, name: "更新商品", method: "PUT", path: B + "/items/1", desc: "PUT 更新商品", body: {name: "更新商品", price: 199.9}, check: "updated" },
            { id: 6, name: "流式响应", method: "GET", path: B + "/stream", desc: "Server-Sent Events 流式响应", stream: true },
            { id: 7, name: "JSON 流", method: "GET", path: B + "/stream/json", desc: "JSON 流式数据传输", stream: true },
            { id: 8, name: "异步延迟", method: "GET", path: B + "/async/delay/1", desc: "异步延迟操作", check: "actual_duration" },
            { id: 9, name: "并行任务", method: "GET", path: B + "/async/parallel", desc: "并行异步任务", check: "tasks" },
            { id: 10, name: "验证错误", method: "GET", path: B + "/error/validation", desc: "参数验证错误", expectError: true },
            { id: 11, name: "500 错误", method: "GET", path: B + "/error/500", desc: "服务器错误", expectError: true },
            { id: 12, name: "自定义响应", method: "GET", path: B + "/response/custom", desc: "自定义响应模型", check: "user_id" },
            { id: 13, name: "请求头回显", method: "GET", path: B + "/headers/echo", desc: "回显请求头", check: "user_agent" },
            { id: 14, name: "性能测试", method: "GET", path: B + "/performance/compute/1000", desc: "计算性能测试", check: "result" },
            { id: 15, name: "Sleep 3s (应通过)", method: "GET", path: B + "/sleep?seconds=3", desc: "maxDuration=8s, sleep 3s 应正常返回", check: "Slept" },
            { id: 16, name: "Sleep 6s (应通过)", method: "GET", path: B + "/sleep?seconds=6", desc: "maxDuration=8s, sleep 6s 应正常返回", check: "Slept" },
            { id: 17, name: "Sleep 12s (应超时)", method: "GET", path: B + "/sleep?seconds=12", desc: "maxDuration=8s, sleep 12s 应被终止", expectError: true }
        ];

        let stats = { total: tests.length, passed: 0, failed: 0 };

        function initTests() {
            const grid = document.getElementById('testGrid');
            tests.forEach(test => {
                const card = document.createElement('div');
                card.className = 'test-card';
                card.id = `test-${test.id}`;
                card.innerHTML = `
                    <div class="test-header">
                        <div class="test-icon">${test.id}</div>
                        <div class="test-title">${test.name}</div>
                        <span class="test-method method-${test.method}">${test.method}</span>
                    </div>
                    <div class="test-desc">${test.desc}</div>
                    <div class="test-url">${test.path}</div>
                    <div class="test-status status-pending" id="status-${test.id}">⏸ 待运行</div>
                    <div class="test-result" id="result-${test.id}" style="display: none;"></div>
                    <div class="test-time" id="time-${test.id}"></div>
                `;
                grid.appendChild(card);
            });
            updateStats();
        }

        function updateStats() {
            document.getElementById('total').textContent = stats.total;
            document.getElementById('passed').textContent = stats.passed;
            document.getElementById('failed').textContent = stats.failed;
        }

        async function runTest(test) {
            const statusEl = document.getElementById(`status-${test.id}`);
            const resultEl = document.getElementById(`result-${test.id}`);
            const timeEl = document.getElementById(`time-${test.id}`);
            statusEl.className = 'test-status status-running';
            statusEl.innerHTML = '⏳ 运行中...';
            resultEl.style.display = 'none';
            const startTime = Date.now();
            try {
                const options = { method: test.method };
                if (test.body) {
                    options.headers = { 'Content-Type': 'application/json' };
                    options.body = JSON.stringify(test.body);
                }
                const response = await fetch(test.path, options);
                const elapsed = Date.now() - startTime;
                let resultText = '';
                if (test.stream) {
                    resultText = `状态码: ${response.status}\nContent-Type: ${response.headers.get('content-type')}\n流式响应已启动`;
                } else {
                    resultText = await response.text();
                }
                const success = test.expectError ? (!response.ok) : (response.ok && (!test.check || resultText.includes(test.check)));
                statusEl.className = success ? 'test-status status-success' : 'test-status status-error';
                statusEl.innerHTML = success ? '✅ 通过' : '❌ 失败';
                success ? stats.passed++ : stats.failed++;
                resultEl.textContent = resultText.substring(0, 500) + (resultText.length > 500 ? '...' : '');
                resultEl.style.display = 'block';
                timeEl.textContent = `响应时间: ${elapsed}ms | 状态码: ${response.status}`;
            } catch (error) {
                statusEl.className = 'test-status status-error';
                statusEl.innerHTML = '❌ 失败';
                resultEl.textContent = `错误: ${error.message}`;
                resultEl.style.display = 'block';
                stats.failed++;
            }
            updateStats();
        }

        async function runAllTests() {
            stats.passed = 0; stats.failed = 0; updateStats();
            for (const test of tests) {
                await runTest(test);
                await new Promise(r => setTimeout(r, 300));
            }
        }

        function clearResults() {
            tests.forEach(test => {
                document.getElementById(`status-${test.id}`).className = 'test-status status-pending';
                document.getElementById(`status-${test.id}`).innerHTML = '⏸ 待运行';
                document.getElementById(`result-${test.id}`).style.display = 'none';
                document.getElementById(`time-${test.id}`).textContent = '';
            });
            stats.passed = 0; stats.failed = 0; updateStats();
        }

        initTests();
    </script>
</body>
</html>"""


def handler(request):
    """返回静态 HTML 测试页面"""
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html; charset=utf-8"},
        "body": HTML_PAGE
    }
