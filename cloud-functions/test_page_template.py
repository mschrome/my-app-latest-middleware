"""
通用测试页面生成器
为不同框架生成统一风格的自动测试页面
"""

def generate_test_page(framework_name, framework_color, tests):
    """
    生成测试页面 HTML
    
    Args:
        framework_name: 框架名称 (如 "Django", "Sanic")
        framework_color: 渐变色 (如 "#4caf50, #2196f3")
        tests: 测试用例列表，每个测试包含:
            - id: 测试编号
            - name: 测试名称
            - method: HTTP 方法
            - path: API 路径
            - desc: 描述
            - check: 期望包含的字符串(可选)
            - body: POST/PUT 请求体(可选)
            - expectError: 期望错误(可选)
            - expectStatus: 期望状态码(可选)
            - stream: 是否流式(可选)
    """
    
    import json
    tests_json = json.dumps(tests)
    
    return f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{framework_name} 框架测试</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               background: linear-gradient(135deg, {framework_color}); 
               padding: 20px; min-height: 100vh; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .header {{ background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px; 
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }}
        .header h1 {{ font-size: 32px; margin-bottom: 10px; }}
        .header .version {{ color: #666; font-size: 14px; }}
        .controls {{ background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }}
        .btn {{ padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; 
               cursor: pointer; transition: all 0.3s; font-weight: 600; }}
        .btn-primary {{ background: #2196f3; color: white; }}
        .btn-primary:hover {{ background: #1976d2; transform: translateY(-2px); }}
        .btn-secondary {{ background: #f0f0f0; color: #333; }}
        .btn-secondary:hover {{ background: #e0e0e0; }}
        .stats {{ display: flex; gap: 15px; margin-left: auto; font-size: 14px; flex-wrap: wrap; }}
        .stat {{ padding: 8px 16px; border-radius: 6px; font-weight: 600; }}
        .stat-total {{ background: #e3f2fd; color: #1976d2; }}
        .stat-pass {{ background: #e8f5e9; color: #388e3c; }}
        .stat-fail {{ background: #ffebee; color: #d32f2f; }}
        .test-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }}
        .test-card {{ background: white; border-radius: 12px; padding: 18px; 
                     box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s; }}
        .test-card:hover {{ box-shadow: 0 8px 24px rgba(0,0,0,0.15); transform: translateY(-2px); }}
        .test-header {{ display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }}
        .test-icon {{ width: 28px; height: 28px; border-radius: 8px; display: flex; 
                     align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
                     background: linear-gradient(135deg, {framework_color}); color: white; }}
        .test-title {{ font-size: 15px; font-weight: 700; color: #333; flex: 1; }}
        .test-method {{ padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; }}
        .method-GET {{ background: #e3f2fd; color: #1976d2; }}
        .method-POST {{ background: #fff3e0; color: #f57c00; }}
        .method-PUT {{ background: #f3e5f5; color: #7b1fa2; }}
        .method-DELETE {{ background: #ffebee; color: #c62828; }}
        .test-desc {{ color: #666; font-size: 12px; margin-bottom: 10px; }}
        .test-url {{ background: #f5f5f5; padding: 8px; border-radius: 5px; font-family: 'Courier New', monospace; 
                    font-size: 11px; color: #333; margin-bottom: 10px; word-break: break-all; }}
        .test-status {{ padding: 6px 10px; border-radius: 5px; font-size: 12px; font-weight: 600; 
                       display: inline-flex; align-items: center; gap: 5px; }}
        .status-pending {{ background: #f5f5f5; color: #999; }}
        .status-running {{ background: #fff3e0; color: #f57c00; animation: pulse 1.5s infinite; }}
        .status-success {{ background: #e8f5e9; color: #388e3c; }}
        .status-error {{ background: #ffebee; color: #d32f2f; }}
        .test-result {{ margin-top: 10px; padding: 10px; border-radius: 5px; font-size: 11px; 
                       background: #f9f9f9; max-height: 150px; overflow-y: auto; font-family: monospace; }}
        .test-time {{ color: #666; font-size: 10px; margin-top: 6px; }}
        @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.6; }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 {framework_name} 框架测试</h1>
            <div class="version">EdgeOne Pages Python Cloud Functions</div>
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
        
        const testsData = {tests_json};
        // 修改所有测试路径，使用绝对路径
        const tests = testsData.map(test => ({{
            ...test,
            path: test.path.startsWith('./') ? basePath + test.path.substring(1) : 
                  test.path.startsWith('/') ? test.path : basePath + '/' + test.path
        }}));
        
        let stats = {{ total: tests.length, passed: 0, failed: 0 }};

        function initTests() {{
            const grid = document.getElementById('testGrid');
            tests.forEach(test => {{
                const card = document.createElement('div');
                card.className = 'test-card';
                card.id = `test-${{test.id}}`;
                card.innerHTML = `
                    <div class="test-header">
                        <div class="test-icon">${{test.id}}</div>
                        <div class="test-title">${{test.name}}</div>
                        <span class="test-method method-${{test.method}}">${{test.method}}</span>
                    </div>
                    <div class="test-desc">${{test.desc}}</div>
                    <div class="test-url">${{test.path}}</div>
                    <div class="test-status status-pending" id="status-${{test.id}}">⏸ 待运行</div>
                    <div class="test-result" id="result-${{test.id}}" style="display: none;"></div>
                    <div class="test-time" id="time-${{test.id}}"></div>
                `;
                grid.appendChild(card);
            }});
            updateStats();
        }}

        function updateStats() {{
            document.getElementById('total').textContent = stats.total;
            document.getElementById('passed').textContent = stats.passed;
            document.getElementById('failed').textContent = stats.failed;
        }}

        async function runTest(test) {{
            const statusEl = document.getElementById(`status-${{test.id}}`);
            const resultEl = document.getElementById(`result-${{test.id}}`);
            const timeEl = document.getElementById(`time-${{test.id}}`);
            
            statusEl.className = 'test-status status-running';
            statusEl.innerHTML = '⏳ 运行中...';
            resultEl.style.display = 'none';
            
            const startTime = Date.now();
            
            try {{
                const options = {{ method: test.method, redirect: 'manual' }};
                if (test.body) {{
                    options.headers = {{ 'Content-Type': 'application/json' }};
                    options.body = JSON.stringify(test.body);
                }}
                
                const response = await fetch(test.path, options);
                const elapsed = Date.now() - startTime;
                
                let resultText = '';
                if (test.stream) {{
                    resultText = `状态码: ${{response.status}}\\nContent-Type: ${{response.headers.get('content-type')}}\\n流式响应`;
                }} else {{
                    resultText = await response.text();
                }}
                
                let success = false;
                if (test.expectStatus) {{
                    success = response.status === test.expectStatus;
                }} else if (test.expectError) {{
                    success = !response.ok;
                }} else {{
                    success = response.ok && (!test.check || resultText.includes(test.check));
                }}
                
                if (success) {{
                    statusEl.className = 'test-status status-success';
                    statusEl.innerHTML = '✅ 通过';
                    stats.passed++;
                }} else {{
                    statusEl.className = 'test-status status-error';
                    statusEl.innerHTML = '❌ 失败';
                    stats.failed++;
                }}
                
                resultEl.textContent = resultText.substring(0, 400) + (resultText.length > 400 ? '...' : '');
                resultEl.style.display = 'block';
                timeEl.textContent = `响应时间: ${{elapsed}}ms | 状态码: ${{response.status}}`;
                
            }} catch (error) {{
                statusEl.className = 'test-status status-error';
                statusEl.innerHTML = '❌ 失败';
                resultEl.textContent = `错误: ${{error.message}}`;
                resultEl.style.display = 'block';
                stats.failed++;
            }}
            
            updateStats();
        }}

        async function runAllTests() {{
            stats.passed = 0;
            stats.failed = 0;
            updateStats();
            
            for (const test of tests) {{
                await runTest(test);
                await new Promise(resolve => setTimeout(resolve, 250));
            }}
        }}

        function clearResults() {{
            tests.forEach(test => {{
                document.getElementById(`status-${{test.id}}`).className = 'test-status status-pending';
                document.getElementById(`status-${{test.id}}`).innerHTML = '⏸ 待运行';
                document.getElementById(`result-${{test.id}}`).style.display = 'none';
                document.getElementById(`time-${{test.id}}`).textContent = '';
            }});
            stats.passed = 0;
            stats.failed = 0;
            updateStats();
        }}

        initTests();
    </script>
</body>
</html>
    """
