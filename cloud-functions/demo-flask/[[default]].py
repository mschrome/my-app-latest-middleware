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
    """根路径 - API 信息"""
    return jsonify({
        "name": "Flask Demo",
        "framework": "Flask",
        "version": "2.0+",
        "routes": ["/health", "/users/<id>", "/search", "/stream", "/sleep"]
    })


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


# ============ 11. maxDuration 超时测试 ============
@app.route('/sleep')
def sleep_test():
    """maxDuration 超时测试 (edgeone.json: python.maxDuration = 8s)"""
    seconds = int(request.args.get('seconds', 5))
    if seconds < 1:
        seconds = 1
    if seconds > 120:
        seconds = 120
    
    start = time.time()
    time.sleep(seconds)
    elapsed = time.time() - start
    
    return jsonify({
        "message": f"Slept for {seconds} seconds",
        "requested_sleep": seconds,
        "actual_elapsed": f"{elapsed:.2f}s",
        "max_duration": "8s (configured in edgeone.json)",
        "within_limit": seconds <= 8
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
