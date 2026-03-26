"""
Python 函数 Demo - 不依赖重型 Web 框架
使用 Starlette 作为最轻量的 ASGI 适配层
保持原有 handler 逻辑不变
"""
import json
import time
import urllib.parse
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response, HTMLResponse, JSONResponse
from starlette.routing import Route, Mount


# ============ 核心处理逻辑 ============

def _dispatch(method, path, query, headers, body):
    """
    统一路由分发（纯逻辑，不依赖任何框架）

    Args:
        method: HTTP 方法
        path: 请求路径
        query: 查询参数 dict
        headers: 请求头 dict
        body: 请求体字符串

    Returns:
        dict: 包含 statusCode, headers, body 的响应
    """
    # 去掉前缀路径，只保留相对路径
    # 例如 /cf/demo-plain/users/1 -> /users/1
    base_prefix = '/demo-plain'
    if path.startswith(base_prefix):
        path = path[len(base_prefix):] or '/'

    # 路由分发
    routes = {
        ('GET', '/'): handle_root,
        ('GET', '/health'): handle_health,
        ('GET', '/info'): handle_info,
        ('GET', '/echo'): handle_echo,
        ('POST', '/echo'): handle_echo,
        ('GET', '/time'): handle_time,
        ('GET', '/headers'): handle_headers,
        ('POST', '/json'): handle_json_body,
        ('GET', '/search'): handle_search,
        ('GET', '/error'): handle_error,
    }

    # 匹配动态路由 /users/<id>
    if path.startswith('/users/') and method == 'GET':
        user_id = path.split('/users/')[1].split('/')[0]
        return handle_get_user(user_id)
    if path == '/users' and method == 'POST':
        return handle_create_user(body)

    route_handler = routes.get((method, path))
    if route_handler:
        return route_handler(method, path, query, headers, body)

    return _response(404, {"error": "Not Found", "path": path, "method": method})


# ============ Starlette ASGI 适配层 ============

async def catch_all(request: Request):
    """将 HTTP 请求转发给核心处理逻辑"""
    body_bytes = await request.body()
    body = body_bytes.decode('utf-8') if body_bytes else ''

    result = _dispatch(
        method=request.method,
        path=request.url.path,
        query=dict(request.query_params),
        headers={k.lower(): v for k, v in request.headers.items()},
        body=body,
    )

    return Response(
        content=result.get('body', ''),
        status_code=result.get('statusCode', 200),
        headers=result.get('headers', {}),
    )


app = Starlette(routes=[
    Route('/{path:path}', catch_all, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    Route('/', catch_all, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
])


# ============ 响应构造 ============

def _response(status_code, body_data, extra_headers=None):
    """构造标准响应"""
    resp_headers = {
        'Content-Type': 'application/json',
        'X-Powered-By': 'Plain Python Function',
    }
    if extra_headers:
        resp_headers.update(extra_headers)

    return {
        'statusCode': status_code,
        'headers': resp_headers,
        'body': json.dumps(body_data, ensure_ascii=False),
    }


def _html_response(status_code, html_content):
    """构造 HTML 响应"""
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'text/html; charset=utf-8'},
        'body': html_content,
    }


# ============ 路由处理函数 ============

def handle_root(method, path, query, headers, body):
    """根路径 - API 信息"""
    return _response(200, {
        "name": "Plain Python Function Demo",
        "framework": "None (Plain Python)",
        "routes": ["/info", "/health", "/users/<id>", "/search", "/echo", "/time", "/headers", "/json", "/error"]
    })


def handle_health(method, path, query, headers, body):
    """健康检查"""
    return _response(200, {
        "status": "healthy",
        "timestamp": time.time(),
        "type": "plain_function"
    })


def handle_info(method, path, query, headers, body):
    """基本信息"""
    return _response(200, {
        "name": "Plain Python Function Demo",
        "framework": "None (Plain Python)",
        "description": "不依赖任何 Web 框架的 Python 函数，直接处理请求和响应",
        "features": [
            "无框架依赖",
            "轻量级",
            "直接处理请求/响应",
            "手动路由分发",
        ]
    })


def handle_echo(method, path, query, headers, body):
    """回显请求信息"""
    return _response(200, {
        "method": method,
        "query": query,
        "headers_count": len(headers),
        "body": body[:500] if body else None,
        "timestamp": time.time()
    })


def handle_time(method, path, query, headers, body):
    """返回当前时间"""
    import datetime
    now = datetime.datetime.now()
    return _response(200, {
        "timestamp": time.time(),
        "iso": now.isoformat(),
        "formatted": now.strftime("%Y-%m-%d %H:%M:%S"),
    })


def handle_headers(method, path, query, headers, body):
    """返回请求头信息"""
    return _response(200, {
        "user_agent": headers.get('user-agent', 'unknown'),
        "content_type": headers.get('content-type', 'none'),
        "accept": headers.get('accept', 'none'),
        "host": headers.get('host', 'unknown'),
        "all_headers": dict(headers)
    })


def handle_json_body(method, path, query, headers, body):
    """处理 JSON 请求体"""
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body"})

    return _response(200, {
        "message": "JSON received and parsed",
        "received": data,
        "keys": list(data.keys()),
        "size": len(body)
    })


def handle_search(method, path, query, headers, body):
    """搜索功能"""
    q = query.get('q', '')
    limit = int(query.get('limit', '10'))
    offset = int(query.get('offset', '0'))

    if not q:
        return _response(400, {"error": "Query parameter 'q' is required"})

    results = [
        {"id": i, "name": f"Result {i}", "score": round(0.95 - i * 0.08, 2)}
        for i in range(offset, offset + min(limit, 10))
    ]

    return _response(200, {
        "query": q,
        "limit": limit,
        "offset": offset,
        "count": len(results),
        "results": results
    })


def handle_get_user(user_id):
    """获取用户"""
    try:
        uid = int(user_id)
    except ValueError:
        return _response(400, {"error": "Invalid user ID"})

    return _response(200, {
        "user_id": uid,
        "username": f"user_{uid}",
        "email": f"user{uid}@example.com",
        "source": "plain_function"
    })


def handle_create_user(body):
    """创建用户"""
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body"})

    if 'username' not in data:
        return _response(400, {"error": "Username is required"})

    return _response(201, {
        "message": "User created",
        "user": {
            "id": 12345,
            "username": data['username'],
            "email": data.get('email', ''),
        }
    })


def handle_error(method, path, query, headers, body):
    """触发错误测试"""
    return _response(500, {
        "error": "Internal Server Error",
        "message": "This is an intentional error for testing",
        "type": "TestError"
    })
