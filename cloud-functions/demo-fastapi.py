"""
FastAPI Demo - 完整功能测试
支持：基础路由、参数验证、流式响应、文件上传、异步操作
"""
from fastapi import FastAPI, Query, Path, Body, UploadFile, File, Header
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import asyncio
import json
import time

app = FastAPI(title="FastAPI Demo for EdgeOne Pages")


# ============ 数据模型 ============
class Item(BaseModel):
    name: str = Field(..., description="Item name")
    price: float = Field(..., gt=0, description="Item price")
    description: Optional[str] = None
    tags: List[str] = []


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    framework: str = "FastAPI"


# ============ 1. 基础路由 ============
@app.get("/")
async def root():
    """根路径 - 返回带自动测试的 HTML 页面"""
    html_content = """
<!DOCTYPE html>
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
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; 
               cursor: pointer; transition: all 0.3s; font-weight: 600; }
        .btn-primary { background: #009688; color: white; }
        .btn-primary:hover { background: #00796b; transform: translateY(-2px); }
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
        .loading { text-align: center; padding: 40px; color: white; font-size: 18px; }
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
        // 获取当前页面的完整路径作为基础路径
        const currentPath = window.location.pathname;
        const basePath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        
        const tests = [
            { id: 1, name: "基础路由", method: "GET", path: basePath, desc: "获取 API 基本信息", check: "FastAPI" },
            { id: 2, name: "健康检查", method: "GET", path: basePath + "/health", desc: "服务健康状态", check: "healthy" },
            { id: 3, name: "获取用户", method: "GET", path: basePath + "/users/1", desc: "通过 ID 获取用户信息", check: "user_" },
            { id: 4, name: "搜索功能", method: "GET", path: basePath + "/search?q=test", desc: "搜索 API", check: "query" },
            { id: 5, name: "创建商品", method: "POST", path: basePath + "/items", desc: "POST 创建商品", body: {name: "测试商品", price: 99.9, description: "测试描述", tags: ["test"]}, check: "id" },
            { id: 6, name: "更新商品", method: "PUT", path: basePath + "/items/1", desc: "PUT 更新商品", body: {name: "更新商品", price: 199.9}, check: "updated" },
            { id: 7, name: "流式响应", method: "GET", path: basePath + "/stream", desc: "Server-Sent Events 流式响应", stream: true },
            { id: 8, name: "JSON 流", method: "GET", path: basePath + "/stream/json", desc: "JSON 流式数据传输", stream: true },
            { id: 9, name: "异步延迟", method: "GET", path: basePath + "/async/delay/1", desc: "异步延迟操作", check: "actual_duration" },
            { id: 10, name: "并行任务", method: "GET", path: basePath + "/async/parallel", desc: "并行异步任务", check: "tasks" },
            { id: 11, name: "验证错误", method: "GET", path: basePath + "/error/validation", desc: "参数验证错误", expectError: true },
            { id: 12, name: "500 错误", method: "GET", path: basePath + "/error/500", desc: "服务器错误", expectError: true },
            { id: 13, name: "自定义响应", method: "GET", path: basePath + "/response/custom", desc: "自定义响应模型", check: "user_id" },
            { id: 14, name: "状态码测试", method: "GET", path: basePath + "/response/status", desc: "HTTP 状态码", check: "Created successfully" },
            { id: 15, name: "请求头回显", method: "GET", path: basePath + "/headers/echo", desc: "回显请求头", check: "user_agent" },
            { id: 16, name: "性能测试", method: "GET", path: basePath + "/performance/compute/1000", desc: "计算性能测试", check: "result" }
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
                        <div class="test-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
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
                const options = { method: test.method };
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
                
                const success = test.expectError ? (!response.ok) : (response.ok && (!test.check || resultText.includes(test.check)));
                
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
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": time.time()}


# ============ 2. 路径参数和查询参数 ============
@app.get("/users/{user_id}")
async def get_user(
    user_id: int = Path(..., ge=1, description="User ID must be positive"),
    include_email: bool = Query(True, description="Include email in response")
):
    """获取用户信息"""
    response = UserResponse(
        user_id=user_id,
        username=f"user_{user_id}",
        email=f"user{user_id}@example.com" if include_email else "hidden"
    )
    return response


@app.get("/search")
async def search_items(
    q: str = Query(..., min_length=1, max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort: Optional[str] = Query(None, regex="^(asc|desc)$")
):
    """搜索功能 - 带查询参数验证"""
    return {
        "query": q,
        "skip": skip,
        "limit": limit,
        "sort": sort,
        "results": [
            {"id": i, "name": f"Item {i}", "match_score": 0.95 - i * 0.1}
            for i in range(skip, skip + min(limit, 5))
        ]
    }


# ============ 3. 请求体处理 ============
@app.post("/items")
async def create_item(item: Item):
    """创建项目 - 带数据验证"""
    return {
        "message": "Item created successfully",
        "item": item.dict(),
        "id": 12345
    }


@app.put("/items/{item_id}")
async def update_item(
    item_id: int = Path(..., ge=1),
    item: Item = Body(...),
    x_user_id: Optional[str] = Header(None)
):
    """更新项目 - 支持请求头"""
    return {
        "message": "Item updated",
        "item_id": item_id,
        "updated_by": x_user_id,
        "data": item.dict()
    }


# ============ 4. 流式响应 ============
async def generate_stream():
    """生成流式数据"""
    for i in range(10):
        data = {
            "chunk": i,
            "timestamp": time.time(),
            "message": f"Streaming data chunk {i}"
        }
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.5)
    yield "data: [DONE]\n\n"


@app.get("/stream")
async def stream_response():
    """SSE 流式响应"""
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


async def generate_json_stream():
    """生成 JSON 流"""
    yield '{"status": "processing", "data": ['
    for i in range(5):
        if i > 0:
            yield ","
        item = {"id": i, "value": f"item_{i}"}
        yield json.dumps(item)
        await asyncio.sleep(0.3)
    yield ']}'


@app.get("/stream/json")
async def stream_json():
    """JSON 流式响应"""
    return StreamingResponse(
        generate_json_stream(),
        media_type="application/json"
    )


# ============ 5. 文件上传 ============
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Body(None)
):
    """文件上传"""
    content = await file.read()
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "description": description,
        "preview": content[:100].decode('utf-8', errors='ignore')
    }


@app.post("/upload/multiple")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    """多文件上传"""
    results = []
    for file in files:
        content = await file.read()
        results.append({
            "filename": file.filename,
            "size": len(content)
        })
    return {
        "total": len(files),
        "files": results
    }


# ============ 6. 异步操作 ============
@app.get("/async/delay/{seconds}")
async def async_delay(seconds: int = Path(..., ge=1, le=10)):
    """模拟异步延迟操作"""
    start = time.time()
    await asyncio.sleep(seconds)
    return {
        "requested_delay": seconds,
        "actual_duration": time.time() - start,
        "message": "Async operation completed"
    }


@app.get("/async/parallel")
async def async_parallel():
    """并发异步操作"""
    async def task(task_id: int, delay: float):
        await asyncio.sleep(delay)
        return {"task_id": task_id, "delay": delay}
    
    start = time.time()
    tasks = [task(i, 0.5) for i in range(5)]
    results = await asyncio.gather(*tasks)
    
    return {
        "total_tasks": len(results),
        "total_duration": time.time() - start,
        "results": results
    }


# ============ 7. 错误处理 ============
@app.get("/error/validation")
async def error_validation(age: int = Query(..., ge=0, le=150)):
    """测试参数验证错误"""
    return {"age": age, "valid": True}


@app.get("/error/500")
async def error_500():
    """测试服务器错误"""
    raise Exception("Intentional server error for testing")


# ============ 8. 响应模型 ============
@app.get("/response/custom", response_model=UserResponse)
async def custom_response():
    """自定义响应模型"""
    return UserResponse(
        user_id=999,
        username="fastapi_user",
        email="fastapi@example.com"
    )


@app.get("/response/status")
async def custom_status():
    """自定义状态码"""
    return JSONResponse(
        content={"message": "Created successfully"},
        status_code=201,
        headers={"X-Custom-Header": "FastAPI-Demo"}
    )


# ============ 9. 中间件功能测试 ============
@app.get("/headers/echo")
async def echo_headers(
    user_agent: Optional[str] = Header(None),
    x_request_id: Optional[str] = Header(None),
    accept_language: Optional[str] = Header(None)
):
    """回显请求头"""
    return {
        "user_agent": user_agent,
        "request_id": x_request_id,
        "language": accept_language
    }


# ============ 10. 性能测试 ============
@app.get("/performance/compute/{n}")
async def performance_test(n: int = Path(..., ge=1, le=1000000)):
    """计算密集型测试"""
    start = time.time()
    result = sum(i * i for i in range(n))
    duration = time.time() - start
    
    return {
        "input": n,
        "result": result,
        "duration_seconds": duration,
        "operations_per_second": n / duration if duration > 0 else 0
    }
