"""
Flask Demo - 完整功能测试
支持：基础路由、请求处理、流式响应、文件上传、会话管理
"""
from flask import Flask, request, jsonify, Response, stream_with_context, make_response
import json
import time
from typing import Generator

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


# ============ 1. 基础路由 ============
@app.route('/')
def root():
    """根路径 - 返回带自动测试的 HTML 页面"""
    html_content = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flask 框架测试</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
               padding: 20px; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; 
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h1 { color: #e91e63; font-size: 32px; margin-bottom: 10px; }
        .header .version { color: #666; font-size: 14px; }
        .controls { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; 
               cursor: pointer; transition: all 0.3s; font-weight: 600; }
        .btn-primary { background: #e91e63; color: white; }
        .btn-primary:hover { background: #c2185b; transform: translateY(-2px); }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-secondary:hover { background: #e0e0e0; }
        .stats { display: flex; gap: 15px; margin-left: auto; font-size: 14px; }
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
                     align-items: center; justify-content: center; font-size: 18px; }
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
                       background: #f9f9f9; max-height: 200px; overflow-y: auto; }
        .test-time { color: #666; font-size: 11px; margin-top: 8px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌶 Flask 框架测试</h1>
            <div class="version">Version: 2.0+ | EdgeOne Pages Python Cloud Functions</div>
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
        // 获取当前页面的完整路径作为基础路径
        const currentPath = window.location.pathname;
        const basePath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        
        const tests = [
            { id: 1, name: "基础路由", method: "GET", path: basePath, desc: "获取 Flask 框架信息", check: "Flask" },
            { id: 2, name: "健康检查", method: "GET", path: basePath + "/health", desc: "服务健康状态检查", check: "healthy" },
            { id: 3, name: "获取用户", method: "GET", path: basePath + "/users/1", desc: "GET 用户信息", check: "user_id" },
            { id: 4, name: "创建用户", method: "POST", path: basePath + "/users", desc: "POST 创建用户", body: {username: "测试用户", email: "test@example.com"}, check: "User created" },
            { id: 5, name: "更新用户", method: "PUT", path: basePath + "/users/1", desc: "PUT 更新用户", body: {name: "更新用户", email: "update@example.com"}, check: "updated" },
            { id: 6, name: "删除用户", method: "DELETE", path: basePath + "/users/1", desc: "DELETE 删除用户", expectStatus: 204 },
            { id: 7, name: "搜索功能", method: "GET", path: basePath + "/search?q=test&category=all", desc: "搜索 API", check: "query" },
            { id: 8, name: "流式响应", method: "GET", path: basePath + "/stream", desc: "流式数据传输", stream: true },
            { id: 9, name: "JSON 流", method: "GET", path: basePath + "/stream/json", desc: "JSON 流式传输", stream: true },
            { id: 10, name: "大文件流", method: "GET", path: basePath + "/stream/large", desc: "大数据流式传输", stream: true },
            { id: 11, name: "请求头回显", method: "GET", path: basePath + "/headers/echo", desc: "回显请求头", check: "headers" },
            { id: 12, name: "自定义响应头", method: "GET", path: basePath + "/headers/custom", desc: "设置自定义头", check: "custom headers" },
            { id: 13, name: "设置 Cookie", method: "GET", path: basePath + "/cookie/set", desc: "设置 Cookie", check: "Cookie set" },
            { id: 14, name: "读取 Cookie", method: "GET", path: basePath + "/cookie/get", desc: "读取 Cookie", check: "cookies" },
            { id: 15, name: "错误处理", method: "GET", path: basePath + "/error/test", desc: "测试错误处理", expectError: true },
            { id: 16, name: "多方法测试", method: "POST", path: basePath + "/methods/test", desc: "测试不同 HTTP 方法", body: {test: "data"}, check: "method" },
            { id: 17, name: "性能测试", method: "GET", path: basePath + "/performance/compute/1000", desc: "计算性能测试", check: "result" }
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
                        <div class="test-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                            ${test.id}
                        </div>
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
                const options = { 
                    method: test.method,
                    redirect: 'manual'
                };
                if (test.body) {
                    options.headers = { 'Content-Type': 'application/json' };
                    options.body = JSON.stringify(test.body);
                }
                
                const response = await fetch(test.path, options);
                const elapsed = Date.now() - startTime;
                
                let resultText = '';
                if (test.stream) {
                    resultText = `状态码: ${response.status}\\nContent-Type: ${response.headers.get('content-type')}\\n流式响应已启动`;
                } else {
                    const data = await response.text();
                    resultText = data;
                }
                
                let success = false;
                if (test.expectStatus) {
                    success = response.status === test.expectStatus;
                } else if (test.expectError) {
                    success = !response.ok;
                } else {
                    success = response.ok && (!test.check || resultText.includes(test.check));
                }
                
                if (success) {
                    statusEl.className = 'test-status status-success';
                    statusEl.innerHTML = '✅ 通过';
                    stats.passed++;
                } else {
                    statusEl.className = 'test-status status-error';
                    statusEl.innerHTML = '❌ 失败';
                    stats.failed++;
                }
                
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
            stats.passed = 0;
            stats.failed = 0;
            updateStats();
            
            for (const test of tests) {
                await runTest(test);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        function clearResults() {
            tests.forEach(test => {
                const statusEl = document.getElementById(`status-${test.id}`);
                const resultEl = document.getElementById(`result-${test.id}`);
                const timeEl = document.getElementById(`time-${test.id}`);
                statusEl.className = 'test-status status-pending';
                statusEl.innerHTML = '⏸ 待运行';
                resultEl.style.display = 'none';
                timeEl.textContent = '';
            });
            stats.passed = 0;
            stats.failed = 0;
            updateStats();
        }

        initTests();
    </script>
</body>
</html>
    """
    return html_content


@app.route('/health')
def health():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "timestamp": time.time()
    })


# ============ 2. RESTful API ============
@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """获取用户"""
    include_email = request.args.get('include_email', 'true').lower() == 'true'
    
    return jsonify({
        "user_id": user_id,
        "username": f"user_{user_id}",
        "email": f"user{user_id}@example.com" if include_email else "hidden",
        "framework": "Flask"
    })


@app.route('/users', methods=['POST'])
def create_user():
    """创建用户"""
    data = request.get_json()
    
    if not data or 'username' not in data:
        return jsonify({"error": "Username is required"}), 400
    
    return jsonify({
        "message": "User created",
        "user": {
            "id": 12345,
            "username": data['username'],
            "email": data.get('email', '')
        }
    }), 201


@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """更新用户"""
    data = request.get_json()
    
    return jsonify({
        "message": "User updated",
        "user_id": user_id,
        "updated_fields": list(data.keys())
    })


@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """删除用户"""
    response = make_response('', 204)
    response.headers['X-User-Id'] = str(user_id)
    return response


# ============ 3. 查询参数处理 ============
@app.route('/search')
def search():
    """搜索功能"""
    q = request.args.get('q', '')
    skip = int(request.args.get('skip', 0))
    limit = int(request.args.get('limit', 10))
    sort = request.args.get('sort', 'desc')
    
    if not q:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    results = [
        {
            "id": i,
            "name": f"Item {i}",
            "score": 0.95 - i * 0.1
        }
        for i in range(skip, skip + min(limit, 5))
    ]
    
    return jsonify({
        "query": q,
        "skip": skip,
        "limit": limit,
        "sort": sort,
        "results": results
    })


# ============ 4. 流式响应 ============
def generate_sse_stream() -> Generator[str, None, None]:
    """生成 SSE 流"""
    for i in range(10):
        data = {
            "chunk": i,
            "timestamp": time.time(),
            "message": f"Streaming data chunk {i}"
        }
        yield f"data: {json.dumps(data)}\n\n"
        time.sleep(0.5)
    yield "data: [DONE]\n\n"


@app.route('/stream')
def stream_sse():
    """SSE 流式响应"""
    return Response(
        stream_with_context(generate_sse_stream()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


def generate_json_stream() -> Generator[str, None, None]:
    """生成 JSON 流"""
    yield '{"status": "processing", "data": ['
    for i in range(5):
        if i > 0:
            yield ","
        item = {"id": i, "value": f"item_{i}"}
        yield json.dumps(item)
        time.sleep(0.3)
    yield ']}'


@app.route('/stream/json')
def stream_json():
    """JSON 流式响应"""
    return Response(
        stream_with_context(generate_json_stream()),
        mimetype='application/json'
    )


def generate_large_data() -> Generator[bytes, None, None]:
    """生成大数据流"""
    for i in range(100):
        chunk = f"Chunk {i}: {'x' * 1000}\n"
        yield chunk.encode('utf-8')
        time.sleep(0.1)


@app.route('/stream/large')
def stream_large():
    """大数据流"""
    return Response(
        stream_with_context(generate_large_data()),
        mimetype='text/plain'
    )


# ============ 5. 文件上传 ============
@app.route('/upload', methods=['POST'])
def upload_file():
    """单文件上传"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    content = file.read()
    
    return jsonify({
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "preview": content[:100].decode('utf-8', errors='ignore')
    })


@app.route('/upload/multiple', methods=['POST'])
def upload_multiple():
    """多文件上传"""
    files = request.files.getlist('files')
    
    if not files:
        return jsonify({"error": "No files provided"}), 400
    
    results = []
    for file in files:
        content = file.read()
        results.append({
            "filename": file.filename,
            "size": len(content)
        })
    
    return jsonify({
        "total": len(files),
        "files": results
    })


# ============ 6. 请求头处理 ============
@app.route('/headers/echo')
def echo_headers():
    """回显请求头"""
    return jsonify({
        "user_agent": request.headers.get('User-Agent'),
        "content_type": request.headers.get('Content-Type'),
        "x_request_id": request.headers.get('X-Request-Id'),
        "accept_language": request.headers.get('Accept-Language'),
        "all_headers": dict(request.headers)
    })


@app.route('/headers/custom')
def custom_headers():
    """自定义响应头"""
    response = jsonify({"message": "Response with custom headers"})
    response.headers['X-Custom-Header'] = 'Flask-Demo'
    response.headers['X-Timestamp'] = str(time.time())
    return response


# ============ 7. Cookie 处理 ============
@app.route('/cookie/set')
def set_cookie():
    """设置 Cookie"""
    response = jsonify({"message": "Cookie set"})
    response.set_cookie('demo_cookie', 'flask_value', max_age=3600)
    return response


@app.route('/cookie/get')
def get_cookie():
    """获取 Cookie"""
    cookie_value = request.cookies.get('demo_cookie', 'not_set')
    return jsonify({
        "cookie_value": cookie_value,
        "all_cookies": request.cookies
    })


# ============ 8. 错误处理 ============
@app.errorhandler(404)
def not_found(error):
    """404 错误处理"""
    return jsonify({
        "error": "Not Found",
        "message": "The requested URL was not found",
        "path": request.path
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """500 错误处理"""
    return jsonify({
        "error": "Internal Server Error",
        "message": str(error)
    }), 500


@app.route('/error/test')
def test_error():
    """测试错误"""
    raise Exception("Intentional error for testing")


# ============ 9. 请求方法处理 ============
@app.route('/methods/test', methods=['GET', 'POST', 'PUT', 'DELETE'])
def test_methods():
    """测试不同 HTTP 方法"""
    return jsonify({
        "method": request.method,
        "path": request.path,
        "args": dict(request.args),
        "json": request.get_json() if request.is_json else None
    })


# ============ 10. 性能测试 ============
@app.route('/performance/compute/<int:n>')
def performance_test(n):
    """计算密集型测试"""
    if n > 1000000:
        return jsonify({"error": "n too large"}), 400
    
    start = time.time()
    result = sum(i * i for i in range(n))
    duration = time.time() - start
    
    return jsonify({
        "input": n,
        "result": result,
        "duration_seconds": duration,
        "operations_per_second": n / duration if duration > 0 else 0
    })


# ============ 请求钩子 ============
@app.before_request
def before_request():
    """请求前钩子"""
    request.start_time = time.time()


@app.after_request
def after_request(response):
    """请求后钩子 - 添加处理时间"""
    if hasattr(request, 'start_time'):
        duration = time.time() - request.start_time
        response.headers['X-Process-Time'] = str(duration)
    return response


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
