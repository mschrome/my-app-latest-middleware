"""
Python 函数 Demo - 不依赖任何 Web 框架
直接处理请求和响应，最轻量的云函数实现方式
"""
import json
import time
import urllib.parse


def handler(event, context=None):
    """
    云函数入口
    
    Args:
        event: 请求事件，包含 httpMethod, path, queryStringParameters, headers, body 等
        context: 运行时上下文信息
    
    Returns:
        dict: 包含 statusCode, headers, body 的响应
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    query = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    body = event.get('body', '')
    
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
        return handle_get_user(event, user_id)
    if path == '/users' and method == 'POST':
        return handle_create_user(event)
    
    route_handler = routes.get((method, path))
    if route_handler:
        return route_handler(event)
    
    return response(404, {"error": "Not Found", "path": path, "method": method})


def response(status_code, body_data, extra_headers=None):
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


def html_response(status_code, html_content):
    """构造 HTML 响应"""
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'text/html; charset=utf-8'},
        'body': html_content,
    }


# ============ 路由处理函数 ============

def handle_root(event):
    """根路径 - 返回测试页面"""
    from test_page_template import generate_test_page
    
    tests = [
        {"id": 1, "name": "基础信息", "method": "GET", "path": "./info", "desc": "获取函数基本信息", "check": "Plain Python"},
        {"id": 2, "name": "健康检查", "method": "GET", "path": "./health", "desc": "服务健康状态", "check": "healthy"},
        {"id": 3, "name": "获取用户", "method": "GET", "path": "./users/1", "desc": "GET 用户信息", "check": "user_id"},
        {"id": 4, "name": "创建用户", "method": "POST", "path": "./users", "desc": "POST 创建用户", "body": {"username": "测试", "email": "test@example.com"}, "check": "created"},
        {"id": 5, "name": "搜索功能", "method": "GET", "path": "./search?q=test&limit=5", "desc": "查询参数搜索", "check": "query"},
        {"id": 6, "name": "GET 回显", "method": "GET", "path": "./echo?msg=hello", "desc": "回显请求信息", "check": "method"},
        {"id": 7, "name": "POST 回显", "method": "POST", "path": "./echo", "desc": "回显 POST 请求", "body": {"data": "test"}, "check": "method"},
        {"id": 8, "name": "请求头", "method": "GET", "path": "./headers", "desc": "查看请求头信息", "check": "user_agent"},
        {"id": 9, "name": "当前时间", "method": "GET", "path": "./time", "desc": "获取服务端时间", "check": "timestamp"},
        {"id": 10, "name": "JSON 处理", "method": "POST", "path": "./json", "desc": "处理 JSON 请求体", "body": {"name": "test", "value": 42}, "check": "received"},
        {"id": 11, "name": "错误处理", "method": "GET", "path": "./error", "desc": "触发错误", "expectError": True},
    ]
    
    html_content = generate_test_page("Python 函数", "#306998, #FFD43B", tests)
    return html_response(200, html_content)


def handle_health(event):
    """健康检查"""
    return response(200, {
        "status": "healthy",
        "timestamp": time.time(),
        "type": "plain_function"
    })


def handle_info(event):
    """基本信息"""
    return response(200, {
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


def handle_echo(event):
    """回显请求信息"""
    method = event.get('httpMethod', 'GET')
    query = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    body = event.get('body', '')
    
    return response(200, {
        "method": method,
        "query": query,
        "headers_count": len(headers),
        "body": body[:500] if body else None,
        "timestamp": time.time()
    })


def handle_time(event):
    """返回当前时间"""
    import datetime
    now = datetime.datetime.now()
    return response(200, {
        "timestamp": time.time(),
        "iso": now.isoformat(),
        "formatted": now.strftime("%Y-%m-%d %H:%M:%S"),
    })


def handle_headers(event):
    """返回请求头信息"""
    headers = event.get('headers') or {}
    return response(200, {
        "user_agent": headers.get('user-agent', 'unknown'),
        "content_type": headers.get('content-type', 'none'),
        "accept": headers.get('accept', 'none'),
        "host": headers.get('host', 'unknown'),
        "all_headers": dict(headers)
    })


def handle_json_body(event):
    """处理 JSON 请求体"""
    body = event.get('body', '')
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})
    
    return response(200, {
        "message": "JSON received and parsed",
        "received": data,
        "keys": list(data.keys()),
        "size": len(body)
    })


def handle_search(event):
    """搜索功能"""
    query = event.get('queryStringParameters') or {}
    q = query.get('q', '')
    limit = int(query.get('limit', '10'))
    offset = int(query.get('offset', '0'))
    
    if not q:
        return response(400, {"error": "Query parameter 'q' is required"})
    
    results = [
        {"id": i, "name": f"Result {i}", "score": round(0.95 - i * 0.08, 2)}
        for i in range(offset, offset + min(limit, 10))
    ]
    
    return response(200, {
        "query": q,
        "limit": limit,
        "offset": offset,
        "count": len(results),
        "results": results
    })


def handle_get_user(event, user_id):
    """获取用户"""
    try:
        uid = int(user_id)
    except ValueError:
        return response(400, {"error": "Invalid user ID"})
    
    return response(200, {
        "user_id": uid,
        "username": f"user_{uid}",
        "email": f"user{uid}@example.com",
        "source": "plain_function"
    })


def handle_create_user(event):
    """创建用户"""
    body = event.get('body', '')
    try:
        data = json.loads(body) if body else {}
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})
    
    if 'username' not in data:
        return response(400, {"error": "Username is required"})
    
    return response(201, {
        "message": "User created",
        "user": {
            "id": 12345,
            "username": data['username'],
            "email": data.get('email', ''),
        }
    })


def handle_error(event):
    """触发错误测试"""
    return response(500, {
        "error": "Internal Server Error",
        "message": "This is an intentional error for testing",
        "type": "TestError"
    })
