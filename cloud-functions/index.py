"""
Python Cloud Functions 测试索引
提供所有测试框架的路由索引和快速链接
"""
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="Python Cloud Functions Test Suite",
    description="EdgeOne Pages 支持的所有 Python 框架测试集合",
    version="1.0.0"
)


@app.get("/", response_class=HTMLResponse)
async def root():
    """测试索引页面"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Python Cloud Functions Test Suite</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                color: #667eea;
                margin-bottom: 10px;
                font-size: 2.5em;
            }
            .subtitle {
                color: #666;
                margin-bottom: 30px;
                font-size: 1.2em;
            }
            .frameworks {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }
            .framework-card {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 15px;
                padding: 25px;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            .framework-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .framework-card h3 {
                color: #2d3748;
                margin-bottom: 10px;
                font-size: 1.5em;
            }
            .framework-card p {
                color: #4a5568;
                margin-bottom: 15px;
                line-height: 1.6;
            }
            .framework-card a {
                display: inline-block;
                background: #667eea;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 8px;
                transition: background 0.3s;
                margin-right: 10px;
                margin-top: 5px;
            }
            .framework-card a:hover {
                background: #5a67d8;
            }
            .features {
                background: #f7fafc;
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
            }
            .features h2 {
                color: #2d3748;
                margin-bottom: 20px;
            }
            .features ul {
                list-style: none;
                column-count: 2;
                gap: 20px;
            }
            .features li {
                padding: 10px 0;
                color: #4a5568;
            }
            .features li:before {
                content: "✅ ";
                margin-right: 10px;
            }
            .docs-link {
                display: inline-block;
                background: #48bb78;
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 1.1em;
                transition: background 0.3s;
            }
            .docs-link:hover {
                background: #38a169;
            }
            @media (max-width: 768px) {
                .features ul {
                    column-count: 1;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐍 Python Cloud Functions Test Suite</h1>
            <p class="subtitle">EdgeOne Pages 支持的所有 Python Web 框架完整测试集合</p>
            
            <div class="frameworks">
                <div class="framework-card">
                    <h3>🐍 Python 函数</h3>
                    <p>不依赖任何框架的纯 Python 函数，直接处理请求和响应</p>
                    <a href="/demo-plain">访问 Demo</a>
                </div>
                
                <div class="framework-card">
                    <h3>⚡ FastAPI</h3>
                    <p>现代、快速的异步 Web 框架，支持自动 API 文档和类型提示</p>
                    <a href="/demo-fastapi">访问 Demo</a>
                    <a href="/demo-fastapi/docs" target="_blank">API 文档</a>
                </div>
                
                <div class="framework-card">
                    <h3>🌶️ Flask</h3>
                    <p>轻量级、灵活的 WSGI Web 框架，生态系统丰富</p>
                    <a href="/demo-flask">访问 Demo</a>
                </div>
                
                <div class="framework-card">
                    <h3>🎸 Django</h3>
                    <p>全功能的 Web 框架，内置 ORM、管理后台和认证系统</p>
                    <a href="/demo-django">访问 Demo</a>
                </div>
                
                <div class="framework-card">
                    <h3>🚀 Sanic</h3>
                    <p>高性能异步 Web 框架，支持 WebSocket 和流式响应</p>
                    <a href="/demo-sanic">访问 Demo</a>
                </div>
            </div>
            
            <div class="features">
                <h2>📋 完整功能测试</h2>
                <ul>
                    <li>RESTful API (GET, POST, PUT, DELETE)</li>
                    <li>路径参数和查询参数</li>
                    <li>JSON 请求体处理</li>
                    <li>表单数据和文件上传</li>
                    <li>流式响应 (SSE, JSON Stream)</li>
                    <li>异步操作和并发处理</li>
                    <li>请求头和响应头处理</li>
                    <li>Cookie 和 Session 管理</li>
                    <li>错误处理和异常捕获</li>
                    <li>性能测试和负载测试</li>
                    <li>数据验证和类型检查</li>
                    <li>中间件和请求钩子</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="/docs" class="docs-link" target="_blank">📚 查看 FastAPI 交互式文档</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/api/info")
async def api_info():
    """API 信息"""
    return {
        "name": "Python Cloud Functions Test Suite",
        "version": "1.0.0",
        "frameworks": {
            "plain": {
                "name": "Python 函数",
                "version": "Python 3.x",
                "path": "/demo-plain",
                "features": ["no-framework", "lightweight", "simple", "direct"]
            },
            "fastapi": {
                "name": "FastAPI",
                "version": "0.100.0+",
                "path": "/demo-fastapi",
                "docs": "/demo-fastapi/docs",
                "features": ["async", "type-hints", "auto-docs", "high-performance"]
            },
            "flask": {
                "name": "Flask",
                "version": "2.0.0+",
                "path": "/demo-flask",
                "features": ["lightweight", "flexible", "rich-ecosystem"]
            },
            "django": {
                "name": "Django",
                "version": "4.0+",
                "path": "/demo-django",
                "features": ["full-featured", "ORM", "admin-panel", "authentication"]
            },
            "sanic": {
                "name": "Sanic",
                "version": "21.0+",
                "path": "/demo-sanic",
                "features": ["async", "websocket", "high-performance", "streaming"]
            }
        },
        "test_categories": [
            "Basic Routes",
            "RESTful API",
            "Streaming Responses",
            "File Upload",
            "Async Operations",
            "Error Handling",
            "Performance Testing",
            "Middleware",
            "Request/Response Headers",
            "Cookie Management"
        ]
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "message": "All Python frameworks are ready to test"
    }
