"""
Sanic Demo - 完整功能测试
支持：异步路由、WebSocket、流式响应、高性能
"""
from sanic import Sanic, response
from sanic.request import Request
from sanic.response import json, file_stream
import asyncio
import time

app = Sanic("sanic_demo")


# ============ 1. 基础路由 ============
@app.route("/")
async def root(request: Request):
    """根路径 - 返回测试页面"""
    from test_page_template import generate_test_page
    from sanic.response import html
    
    tests = [
        {"id": 1, "name": "基础路由", "method": "GET", "path": "./", "desc": "获取 Sanic 框架信息", "check": "Sanic"},
        {"id": 2, "name": "健康检查", "method": "GET", "path": "./health", "desc": "服务健康状态", "check": "healthy"},
        {"id": 3, "name": "获取用户", "method": "GET", "path": "./users/1", "desc": "GET 用户信息", "check": "user_id"},
        {"id": 4, "name": "创建用户", "method": "POST", "path": "./users", "desc": "POST 创建用户", "body": {"username": "测试", "email": "test@example.com"}, "check": "User created"},
        {"id": 5, "name": "更新用户", "method": "PUT", "path": "./users/1", "desc": "PUT 更新用户", "body": {"username": "更新", "email": "update@example.com"}, "check": "updated"},
        {"id": 6, "name": "删除用户", "method": "DELETE", "path": "./users/1", "desc": "DELETE 删除用户", "expectStatus": 204},
        {"id": 7, "name": "搜索功能", "method": "GET", "path": "./search?q=test&category=all", "desc": "搜索 API", "check": "query"},
        {"id": 8, "name": "流式响应", "method": "GET", "path": "./stream", "desc": "Server-Sent Events", "stream": True},
        {"id": 9, "name": "JSON 流", "method": "GET", "path": "./stream/json", "desc": "JSON 流式传输", "stream": True},
        {"id": 10, "name": "大数据流", "method": "GET", "path": "./stream/large", "desc": "大数据流", "stream": True},
        {"id": 11, "name": "异步延迟", "method": "GET", "path": "./async/delay/1", "desc": "异步延迟操作", "check": "actual_duration"},
        {"id": 12, "name": "并行任务", "method": "GET", "path": "./async/parallel", "desc": "并行异步任务", "check": "tasks"},
        {"id": 13, "name": "数据库模拟", "method": "GET", "path": "./async/database", "desc": "模拟数据库查询", "check": "user"},
        {"id": 14, "name": "请求头回显", "method": "GET", "path": "./headers/echo", "desc": "回显请求头", "check": "user_agent"},
        {"id": 15, "name": "自定义响应头", "method": "GET", "path": "./headers/custom", "desc": "设置自定义头", "check": "custom headers"},
        {"id": 16, "name": "设置 Cookie", "method": "GET", "path": "./cookie/set", "desc": "设置 Cookie", "check": "Cookie set"},
        {"id": 17, "name": "读取 Cookie", "method": "GET", "path": "./cookie/get", "desc": "读取 Cookie", "check": "cookie"},
        {"id": 18, "name": "错误处理", "method": "GET", "path": "./error/test", "desc": "500 错误", "expectError": True}
    ]
    
    html_content = generate_test_page("Sanic", "#ff6b6b, #4ecdc4", tests)
    return html(html_content)


@app.route("/health")
async def health(request: Request):
    """健康检查"""
    return json({
        "status": "healthy",
        "timestamp": time.time()
    })


# ============ 2. RESTful API ============
@app.route("/users/<user_id:int>", methods=["GET"])
async def get_user(request: Request, user_id: int):
    """获取用户"""
    include_email = request.args.get('include_email', 'true').lower() == 'true'
    
    return json({
        "user_id": user_id,
        "username": f"user_{user_id}",
        "email": f"user{user_id}@example.com" if include_email else "hidden",
        "framework": "Sanic"
    })


@app.route("/users", methods=["POST"])
async def create_user(request: Request):
    """创建用户"""
    data = request.json
    
    if not data or 'username' not in data:
        return json({"error": "Username is required"}, status=400)
    
    return json({
        "message": "User created",
        "user": {
            "id": 12345,
            "username": data['username'],
            "email": data.get('email', '')
        }
    }, status=201)


@app.route("/users/<user_id:int>", methods=["PUT"])
async def update_user(request: Request, user_id: int):
    """更新用户"""
    data = request.json
    
    return json({
        "message": "User updated",
        "user_id": user_id,
        "updated_fields": list(data.keys()) if data else []
    })


@app.route("/users/<user_id:int>", methods=["DELETE"])
async def delete_user(request: Request, user_id: int):
    """删除用户"""
    from sanic.response import empty
    return empty(status=204, headers={'X-User-Id': str(user_id)})


# ============ 3. 查询参数处理 ============
@app.route("/search")
async def search_items(request: Request):
    """搜索功能"""
    q = request.args.get('q', '')
    skip = int(request.args.get('skip', 0))
    limit = int(request.args.get('limit', 10))
    sort_order = request.args.get('sort', 'desc')
    
    if not q:
        return json({"error": "Query parameter 'q' is required"}, status=400)
    
    # 模拟异步数据库查询
    await asyncio.sleep(0.1)
    
    results = [
        {
            "id": i,
            "name": f"Item {i}",
            "score": 0.95 - i * 0.1
        }
        for i in range(skip, skip + min(limit, 5))
    ]
    
    return json({
        "query": q,
        "skip": skip,
        "limit": limit,
        "sort": sort_order,
        "results": results
    })


# ============ 4. 流式响应 ============
@app.route("/stream")
async def stream_sse(request: Request):
    """SSE 流式响应"""
    resp = await request.respond(content_type='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no'
    })
    for i in range(10):
        data = {
            "chunk": i,
            "timestamp": time.time(),
            "message": f"Streaming data chunk {i}"
        }
        import json as json_module
        await resp.send(f"data: {json_module.dumps(data)}\n\n")
        await asyncio.sleep(0.5)
    await resp.send("data: [DONE]\n\n")
    await resp.eof()


@app.route("/stream/json")
async def stream_json_data(request: Request):
    """JSON 流式响应"""
    resp = await request.respond(content_type='application/json')
    await resp.send('{"status": "processing", "data": [')
    for i in range(5):
        if i > 0:
            await resp.send(",")
        import json as json_module
        item = {"id": i, "value": f"item_{i}"}
        await resp.send(json_module.dumps(item))
        await asyncio.sleep(0.3)
    await resp.send(']}')
    await resp.eof()


@app.route("/stream/large")
async def stream_large_data(request: Request):
    """大数据流"""
    resp = await request.respond(content_type='text/plain')
    for i in range(100):
        chunk = f"Chunk {i}: {'x' * 1000}\n"
        await resp.send(chunk)
        await asyncio.sleep(0.1)
    await resp.eof()


# ============ 5. 文件上传 ============
@app.route("/upload", methods=["POST"])
async def upload_file(request: Request):
    """文件上传"""
    if 'file' not in request.files:
        return json({"error": "No file part"}, status=400)
    
    file = request.files.get('file')
    content = file.body
    
    return json({
        "filename": file.name,
        "content_type": file.type,
        "size": len(content),
        "preview": content[:100].decode('utf-8', errors='ignore')
    })


@app.route("/upload/multiple", methods=["POST"])
async def upload_multiple_files(request: Request):
    """多文件上传"""
    files = request.files.getlist('files')
    
    if not files:
        return json({"error": "No files provided"}, status=400)
    
    results = []
    for file in files:
        results.append({
            "filename": file.name,
            "size": len(file.body)
        })
    
    return json({
        "total": len(files),
        "files": results
    })


# ============ 6. 异步操作 ============
@app.route("/async/delay/<seconds:int>")
async def async_delay(request: Request, seconds: int):
    """模拟异步延迟"""
    if seconds > 10:
        return json({"error": "Delay too long"}, status=400)
    
    start = time.time()
    await asyncio.sleep(seconds)
    
    return json({
        "requested_delay": seconds,
        "actual_duration": time.time() - start,
        "message": "Async operation completed"
    })


@app.route("/async/parallel")
async def async_parallel(request: Request):
    """并发异步操作"""
    async def task(task_id: int, delay: float):
        await asyncio.sleep(delay)
        return {"task_id": task_id, "delay": delay}
    
    start = time.time()
    tasks = [task(i, 0.5) for i in range(5)]
    results = await asyncio.gather(*tasks)
    
    return json({
        "total_tasks": len(results),
        "total_duration": time.time() - start,
        "results": results
    })


@app.route("/async/database")
async def async_database_simulation(request: Request):
    """模拟异步数据库操作"""
    async def fetch_user(user_id: int):
        await asyncio.sleep(0.1)  # 模拟 DB 查询
        return {"id": user_id, "name": f"User {user_id}"}
    
    async def fetch_orders(user_id: int):
        await asyncio.sleep(0.15)  # 模拟 DB 查询
        return [{"order_id": i, "amount": i * 100} for i in range(3)]
    
    start = time.time()
    user, orders = await asyncio.gather(
        fetch_user(123),
        fetch_orders(123)
    )
    
    return json({
        "user": user,
        "orders": orders,
        "query_time": time.time() - start
    })


# ============ 7. 请求头处理 ============
@app.route("/headers/echo")
async def echo_headers(request: Request):
    """回显请求头"""
    return json({
        "user_agent": request.headers.get('user-agent'),
        "content_type": request.headers.get('content-type'),
        "x_request_id": request.headers.get('x-request-id'),
        "accept_language": request.headers.get('accept-language'),
        "all_headers": dict(request.headers)
    })


@app.route("/headers/custom")
async def custom_headers(request: Request):
    """自定义响应头"""
    return json(
        {"message": "Response with custom headers"},
        headers={
            'X-Custom-Header': 'Sanic-Demo',
            'X-Timestamp': str(time.time())
        }
    )


# ============ 8. Cookie 处理 ============
@app.route("/cookie/set")
async def set_cookie(request: Request):
    """设置 Cookie"""
    resp = json({"message": "Cookie set"})
    resp.add_cookie('demo_cookie', 'sanic_value', max_age=3600)
    return resp


@app.route("/cookie/get")
async def get_cookie(request: Request):
    """获取 Cookie"""
    cookie_value = request.cookies.get('demo_cookie', 'not_set')
    return json({
        "cookie_value": cookie_value,
        "all_cookies": dict(request.cookies)
    })


# ============ 9. 错误处理 ============
@app.exception(Exception)
async def handle_exception(request: Request, exception: Exception):
    """全局异常处理"""
    return json({
        "error": "Internal Server Error",
        "message": str(exception),
        "type": type(exception).__name__
    }, status=500)


@app.route("/error/test")
async def test_error(request: Request):
    """测试错误"""
    raise Exception("Intentional error for testing")


# ============ 10. 性能测试 ============
@app.route("/performance/compute/<n:int>")
async def performance_test(request: Request, n: int):
    """计算密集型测试"""
    if n > 1000000:
        return json({"error": "n too large"}, status=400)
    
    start = time.time()
    result = sum(i * i for i in range(n))
    duration = time.time() - start
    
    return json({
        "input": n,
        "result": result,
        "duration_seconds": duration,
        "operations_per_second": n / duration if duration > 0 else 0
    })


# ============ 中间件 ============
@app.middleware('request')
async def add_start_time(request: Request):
    """请求前中间件 - 记录开始时间"""
    request.ctx.start_time = time.time()


@app.middleware('response')
async def add_process_time(request: Request, response):
    """响应后中间件 - 添加处理时间"""
    if hasattr(request.ctx, 'start_time'):
        duration = time.time() - request.ctx.start_time
        response.headers['X-Process-Time'] = str(duration)
    return response


# ============ 生命周期钩子 ============
@app.before_server_start
async def setup(app, loop):
    """服务启动前"""
    print("Sanic server is starting...")


@app.after_server_start
async def notify_server_started(app, loop):
    """服务启动后"""
    print("Sanic server started successfully!")


@app.before_server_stop
async def cleanup(app, loop):
    """服务停止前"""
    print("Sanic server is stopping...")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
