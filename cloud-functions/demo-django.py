"""
Django Demo - 完整功能测试
支持：RESTful API、ORM模拟、中间件、流式响应
"""
from django.conf import settings
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse, FileResponse
from django.urls import path
from django.core.wsgi import get_wsgi_application
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import os
import json
import time

# Django 最小配置
if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='django-insecure-demo-key-for-testing-only-' + str(time.time()),
        ROOT_URLCONF=__name__,
        ALLOWED_HOSTS=['*'],
        MIDDLEWARE=[
            'django.middleware.common.CommonMiddleware',
        ],
    )


# ============ 1. 基础视图 ============
def root(request):
    """根路径 - 返回测试页面"""
    from test_page_template import generate_test_page
    
    tests = [
        {"id": 1, "name": "基础路由", "method": "GET", "path": "./", "desc": "获取 Django 框架信息", "check": "Django"},
        {"id": 2, "name": "健康检查", "method": "GET", "path": "./health/", "desc": "服务健康状态", "check": "healthy"},
        {"id": 3, "name": "获取用户", "method": "GET", "path": "./users/1/", "desc": "GET 用户信息", "check": "user_id"},
        {"id": 4, "name": "创建用户", "method": "POST", "path": "./users/create/", "desc": "POST 创建用户", "body": {"username": "测试", "email": "test@example.com"}, "check": "User created"},
        {"id": 5, "name": "更新用户", "method": "PUT", "path": "./users/1/update/", "desc": "PUT 更新用户", "body": {"username": "更新", "email": "update@example.com"}, "check": "updated"},
        {"id": 6, "name": "删除用户", "method": "DELETE", "path": "./users/1/delete/", "desc": "DELETE 删除用户", "expectStatus": 204},
        {"id": 7, "name": "搜索功能", "method": "GET", "path": "./search/?q=test&category=all", "desc": "搜索 API", "check": "query"},
        {"id": 8, "name": "SSE 流", "method": "GET", "path": "./stream/", "desc": "Server-Sent Events", "stream": True},
        {"id": 9, "name": "JSON 流", "method": "GET", "path": "./stream/json/", "desc": "JSON 流式传输", "stream": True},
        {"id": 10, "name": "大数据流", "method": "GET", "path": "./stream/large/", "desc": "大数据流", "stream": True},
        {"id": 11, "name": "请求头回显", "method": "GET", "path": "./headers/echo/", "desc": "回显请求头", "check": "user_agent"},
        {"id": 12, "name": "自定义响应头", "method": "GET", "path": "./headers/custom/", "desc": "设置自定义头", "check": "custom headers"},
        {"id": 13, "name": "设置 Cookie", "method": "GET", "path": "./cookie/set/", "desc": "设置 Cookie", "check": "Cookie set"},
        {"id": 14, "name": "读取 Cookie", "method": "GET", "path": "./cookie/get/", "desc": "读取 Cookie", "check": "cookie"},
        {"id": 15, "name": "方法测试", "method": "POST", "path": "./methods/test/", "desc": "HTTP 方法", "body": {"test": "data"}, "check": "method"},
        {"id": 16, "name": "JSON 变体", "method": "GET", "path": "./json/variants/", "desc": "不同 JSON 响应", "check": "standard"},
        {"id": 17, "name": "性能测试", "method": "GET", "path": "./performance/compute/1000/", "desc": "计算性能", "check": "result"}
    ]
    
    html = generate_test_page("Django", "#4caf50, #2196f3", tests)
    return HttpResponse(html)


def health(request):
    """健康检查"""
    return JsonResponse({
        "status": "healthy",
        "timestamp": time.time()
    })


# ============ 2. RESTful API ============
@require_http_methods(["GET"])
def get_user(request, user_id):
    """获取用户"""
    include_email = request.GET.get('include_email', 'true').lower() == 'true'
    
    return JsonResponse({
        "user_id": user_id,
        "username": f"user_{user_id}",
        "email": f"user{user_id}@example.com" if include_email else "hidden",
        "framework": "Django"
    })


@csrf_exempt
@require_http_methods(["POST"])
def create_user(request):
    """创建用户"""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    if 'username' not in data:
        return JsonResponse({"error": "Username is required"}, status=400)
    
    return JsonResponse({
        "message": "User created",
        "user": {
            "id": 12345,
            "username": data['username'],
            "email": data.get('email', '')
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["PUT"])
def update_user(request, user_id):
    """更新用户"""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    return JsonResponse({
        "message": "User updated",
        "user_id": user_id,
        "updated_fields": list(data.keys())
    })


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_user(request, user_id):
    """删除用户"""
    response = HttpResponse(status=204)
    response['X-User-Id'] = str(user_id)
    return response


# ============ 3. 查询参数处理 ============
def search(request):
    """搜索功能"""
    q = request.GET.get('q', '')
    skip = int(request.GET.get('skip', 0))
    limit = int(request.GET.get('limit', 10))
    sort = request.GET.get('sort', 'desc')
    
    if not q:
        return JsonResponse({"error": "Query parameter 'q' is required"}, status=400)
    
    results = [
        {
            "id": i,
            "name": f"Item {i}",
            "score": 0.95 - i * 0.1
        }
        for i in range(skip, skip + min(limit, 5))
    ]
    
    return JsonResponse({
        "query": q,
        "skip": skip,
        "limit": limit,
        "sort": sort,
        "results": results
    })


# ============ 4. 流式响应 ============
def generate_sse_stream():
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


def stream_sse(request):
    """SSE 流式响应"""
    response = StreamingHttpResponse(
        generate_sse_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


def generate_json_stream():
    """生成 JSON 流"""
    yield '{"status": "processing", "data": ['
    for i in range(5):
        if i > 0:
            yield ","
        item = {"id": i, "value": f"item_{i}"}
        yield json.dumps(item)
        time.sleep(0.3)
    yield ']}'


def stream_json(request):
    """JSON 流式响应"""
    return StreamingHttpResponse(
        generate_json_stream(),
        content_type='application/json'
    )


def generate_large_data():
    """生成大数据流"""
    for i in range(100):
        chunk = f"Chunk {i}: {'x' * 1000}\n"
        yield chunk.encode('utf-8')
        time.sleep(0.1)


def stream_large(request):
    """大数据流"""
    return StreamingHttpResponse(
        generate_large_data(),
        content_type='text/plain'
    )


# ============ 5. 文件上传 ============
@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    """文件上传"""
    if 'file' not in request.FILES:
        return JsonResponse({"error": "No file part"}, status=400)
    
    file = request.FILES['file']
    content = file.read()
    
    return JsonResponse({
        "filename": file.name,
        "content_type": file.content_type,
        "size": len(content),
        "preview": content[:100].decode('utf-8', errors='ignore')
    })


@csrf_exempt
@require_http_methods(["POST"])
def upload_multiple(request):
    """多文件上传"""
    files = request.FILES.getlist('files')
    
    if not files:
        return JsonResponse({"error": "No files provided"}, status=400)
    
    results = []
    for file in files:
        content = file.read()
        results.append({
            "filename": file.name,
            "size": len(content)
        })
    
    return JsonResponse({
        "total": len(files),
        "files": results
    })


# ============ 6. 请求头处理 ============
def echo_headers(request):
    """回显请求头"""
    return JsonResponse({
        "user_agent": request.META.get('HTTP_USER_AGENT'),
        "content_type": request.META.get('CONTENT_TYPE'),
        "x_request_id": request.META.get('HTTP_X_REQUEST_ID'),
        "accept_language": request.META.get('HTTP_ACCEPT_LANGUAGE'),
        "remote_addr": request.META.get('REMOTE_ADDR'),
        "request_method": request.method
    })


def custom_headers(request):
    """自定义响应头"""
    response = JsonResponse({"message": "Response with custom headers"})
    response['X-Custom-Header'] = 'Django-Demo'
    response['X-Timestamp'] = str(time.time())
    return response


# ============ 7. Cookie 处理 ============
def set_cookie(request):
    """设置 Cookie"""
    response = JsonResponse({"message": "Cookie set"})
    response.set_cookie('demo_cookie', 'django_value', max_age=3600)
    return response


def get_cookie(request):
    """获取 Cookie"""
    cookie_value = request.COOKIES.get('demo_cookie', 'not_set')
    return JsonResponse({
        "cookie_value": cookie_value,
        "all_cookies": dict(request.COOKIES)
    })


# ============ 8. 表单数据处理 ============
@csrf_exempt
def form_data(request):
    """处理表单数据"""
    if request.method == 'POST':
        return JsonResponse({
            "method": "POST",
            "post_data": dict(request.POST),
            "files": list(request.FILES.keys())
        })
    return JsonResponse({
        "method": "GET",
        "query_params": dict(request.GET)
    })


# ============ 9. JSON 响应变体 ============
def json_response_variants(request):
    """不同的 JSON 响应格式"""
    format_type = request.GET.get('format', 'standard')
    
    if format_type == 'safe':
        # safe=False 允许返回非字典对象
        return JsonResponse([1, 2, 3, 4, 5], safe=False)
    elif format_type == 'custom':
        response = JsonResponse({"message": "Custom format"})
        response['Content-Disposition'] = 'attachment; filename="data.json"'
        return response
    else:
        return JsonResponse({
            "format": "standard",
            "data": {"key": "value"}
        })


# ============ 10. 性能测试 ============
def performance_test(request, n):
    """计算密集型测试"""
    n = int(n)
    if n > 1000000:
        return JsonResponse({"error": "n too large"}, status=400)
    
    start = time.time()
    result = sum(i * i for i in range(n))
    duration = time.time() - start
    
    return JsonResponse({
        "input": n,
        "result": result,
        "duration_seconds": duration,
        "operations_per_second": n / duration if duration > 0 else 0
    })


# ============ 11. HTTP 方法测试 ============
@csrf_exempt
def test_methods(request):
    """测试不同 HTTP 方法"""
    body_data = None
    if request.method in ['POST', 'PUT', 'PATCH']:
        try:
            body_data = json.loads(request.body.decode('utf-8'))
        except:
            body_data = request.body.decode('utf-8')
    
    return JsonResponse({
        "method": request.method,
        "path": request.path,
        "query_params": dict(request.GET),
        "body": body_data
    })


# ============ URL 路由配置 ============
urlpatterns = [
    # 基础路由
    path('', root, name='root'),
    path('health/', health, name='health'),
    
    # RESTful API
    path('users/<int:user_id>/', get_user, name='get_user'),
    path('users/create/', create_user, name='create_user'),
    path('users/<int:user_id>/update/', update_user, name='update_user'),
    path('users/<int:user_id>/delete/', delete_user, name='delete_user'),
    
    # 查询和搜索
    path('search/', search, name='search'),
    
    # 流式响应
    path('stream/', stream_sse, name='stream_sse'),
    path('stream/json/', stream_json, name='stream_json'),
    path('stream/large/', stream_large, name='stream_large'),
    
    # 文件上传
    path('upload/', upload_file, name='upload_file'),
    path('upload/multiple/', upload_multiple, name='upload_multiple'),
    
    # 请求头
    path('headers/echo/', echo_headers, name='echo_headers'),
    path('headers/custom/', custom_headers, name='custom_headers'),
    
    # Cookie
    path('cookie/set/', set_cookie, name='set_cookie'),
    path('cookie/get/', get_cookie, name='get_cookie'),
    
    # 表单数据
    path('form/', form_data, name='form_data'),
    
    # JSON 响应
    path('json/variants/', json_response_variants, name='json_variants'),
    
    # 性能测试
    path('performance/compute/<int:n>/', performance_test, name='performance_test'),
    
    # HTTP 方法测试
    path('methods/test/', test_methods, name='test_methods'),
]

# WSGI 应用
os.environ.setdefault('DJANGO_SETTINGS_MODULE', __name__)
app = get_wsgi_application()
