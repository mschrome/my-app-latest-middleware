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
import sys
import json
import time

# Django 最小配置
# 注意：通过 importlib 动态加载时，__name__ 可能是非法 Python 标识符（如含连字符或方括号），
# 导致 Django 无法通过 import_module(ROOT_URLCONF) 找到 urlpatterns。
# 解决方案：使用一个合法的固定模块名，并确保 sys.modules 中有对应条目。
_MODULE_NAME = 'demo_django_app'
sys.modules[_MODULE_NAME] = sys.modules[__name__]

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='django-insecure-demo-key-for-testing-only-' + str(time.time()),
        ROOT_URLCONF=_MODULE_NAME,
        ALLOWED_HOSTS=['*'],
        APPEND_SLASH=False,  # 禁用自动追加斜杠，避免运行时去掉尾部斜杠后导致无限重定向
        MIDDLEWARE=[
            'django.middleware.common.CommonMiddleware',
        ],
    )


# ============ 1. 基础视图 ============
def root(request):
    """根路径 - API 信息"""
    return JsonResponse({
        "name": "Django Demo",
        "framework": "Django",
        "version": "4.0+",
        "routes": ["/health/", "/users/<id>/", "/search/", "/stream/", "/performance/compute/<n>/"]
    })


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
# 注意：运行时在路由匹配前会去掉请求路径的尾部斜杠，
# 所以 Django urlpatterns 也不带尾部斜杠（已禁用 APPEND_SLASH）。
# 使用 re_path 支持可选尾部斜杠，兼容两种情况。
from django.urls import re_path

urlpatterns = [
    # 基础路由
    path('', root, name='root'),
    re_path(r'^health/?$', health, name='health'),
    
    # RESTful API
    re_path(r'^users/(?P<user_id>\d+)/?$', get_user, name='get_user'),
    re_path(r'^users/create/?$', create_user, name='create_user'),
    re_path(r'^users/(?P<user_id>\d+)/update/?$', update_user, name='update_user'),
    re_path(r'^users/(?P<user_id>\d+)/delete/?$', delete_user, name='delete_user'),
    
    # 查询和搜索
    re_path(r'^search/?$', search, name='search'),
    
    # 流式响应
    re_path(r'^stream/?$', stream_sse, name='stream_sse'),
    re_path(r'^stream/json/?$', stream_json, name='stream_json'),
    re_path(r'^stream/large/?$', stream_large, name='stream_large'),
    
    # 文件上传
    re_path(r'^upload/?$', upload_file, name='upload_file'),
    re_path(r'^upload/multiple/?$', upload_multiple, name='upload_multiple'),
    
    # 请求头
    re_path(r'^headers/echo/?$', echo_headers, name='echo_headers'),
    re_path(r'^headers/custom/?$', custom_headers, name='custom_headers'),
    
    # Cookie
    re_path(r'^cookie/set/?$', set_cookie, name='set_cookie'),
    re_path(r'^cookie/get/?$', get_cookie, name='get_cookie'),
    
    # 表单数据
    re_path(r'^form/?$', form_data, name='form_data'),
    
    # JSON 响应
    re_path(r'^json/variants/?$', json_response_variants, name='json_variants'),
    
    # 性能测试
    re_path(r'^performance/compute/(?P<n>\d+)/?$', performance_test, name='performance_test'),
    
    # HTTP 方法测试
    re_path(r'^methods/test/?$', test_methods, name='test_methods'),
]

# WSGI 应用
os.environ.setdefault('DJANGO_SETTINGS_MODULE', _MODULE_NAME)
app = get_wsgi_application()
