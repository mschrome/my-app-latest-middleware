package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 根路径 - 测试页面
	r.GET("/", handleRoot)

	// 基础信息
	r.GET("/info", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"name":        "Go Cloud Function Demo (Framework Mode)",
			"framework":   "Gin",
			"description": "使用 Gin 框架实现的云函数",
			"features": []string{
				"Gin 框架多路由支持",
				"高性能编译型语言",
				"JSON 序列化/反序列化",
				"路由分组",
				"请求头/查询参数解析",
			},
		})
	})

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"type":      "go_function",
		})
	})

	// 回显
	r.GET("/echo", handleEcho)
	r.POST("/echo", handleEcho)

	// 时间
	r.GET("/time", func(c *gin.Context) {
		now := time.Now()
		c.JSON(http.StatusOK, gin.H{
			"timestamp": float64(now.UnixMilli()) / 1000.0,
			"iso":       now.Format(time.RFC3339),
			"formatted": now.Format("2006-01-02 15:04:05"),
		})
	})

	// 请求头
	r.GET("/headers", func(c *gin.Context) {
		allHeaders := map[string]string{}
		for k, v := range c.Request.Header {
			allHeaders[k] = v[0]
		}
		c.JSON(http.StatusOK, gin.H{
			"user_agent":   c.GetHeader("User-Agent"),
			"content_type": c.GetHeader("Content-Type"),
			"accept":       c.GetHeader("Accept"),
			"host":         c.Request.Host,
			"all_headers":  allHeaders,
		})
	})

	// JSON 处理
	r.POST("/json", func(c *gin.Context) {
		var data map[string]interface{}
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
			return
		}
		keys := make([]string, 0, len(data))
		for k := range data {
			keys = append(keys, k)
		}
		c.JSON(http.StatusOK, gin.H{
			"message":  "JSON received and parsed",
			"received": data,
			"keys":     keys,
		})
	})

	// 搜索
	r.GET("/search", func(c *gin.Context) {
		q := c.Query("q")
		if q == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
			return
		}
		limit := 10
		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
				limit = parsed
			}
		}
		if limit > 10 {
			limit = 10
		}
		offset := 0
		if o := c.Query("offset"); o != "" {
			if parsed, err := strconv.Atoi(o); err == nil {
				offset = parsed
			}
		}
		results := make([]gin.H, 0, limit)
		for i := offset; i < offset+limit; i++ {
			results = append(results, gin.H{
				"id":    i,
				"name":  fmt.Sprintf("Result %d", i),
				"score": float64(int((0.95-float64(i)*0.08)*100)) / 100.0,
			})
		}
		c.JSON(http.StatusOK, gin.H{
			"query":   q,
			"limit":   limit,
			"offset":  offset,
			"count":   len(results),
			"results": results,
		})
	})

	// 用户相关
	r.GET("/users/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		uid, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"user_id":  uid,
			"username": fmt.Sprintf("user_%d", uid),
			"email":    fmt.Sprintf("user%d@example.com", uid),
			"source":   "go_function",
		})
	})

	r.POST("/users", func(c *gin.Context) {
		var data map[string]interface{}
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON body"})
			return
		}
		username, ok := data["username"]
		if !ok || username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
			return
		}
		email := ""
		if e, ok := data["email"]; ok {
			email = fmt.Sprintf("%v", e)
		}
		c.JSON(http.StatusCreated, gin.H{
			"message": "User created",
			"user": gin.H{
				"id":       12345,
				"username": username,
				"email":    email,
			},
		})
	})

	// 错误处理测试
	r.GET("/error", func(c *gin.Context) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "This is an intentional error for testing",
			"type":    "TestError",
		})
	})

	// CLI 不会剥离文件名前缀，传给 Go 的路径是完整的
	// 例如 /demo-go-framework/info、/demo-go-framework/ 等
	// 需要在请求进入 Gin 之前手动剥离前缀，使 Gin 路由能匹配
	const prefix = "/demo-go-framework"
	fmt.Println("Go framework function listening on :9000")
	http.ListenAndServe(":9000", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := req.URL.Path
		if strings.HasPrefix(path, prefix) {
			path = path[len(prefix):]
			if path == "" {
				path = "/"
			}
			req.URL.Path = path
		}
		r.ServeHTTP(w, req)
	}))
}

// 回显处理
func handleEcho(c *gin.Context) {
	var bodyStr string
	if c.Request.Body != nil {
		bodyBytes, err := c.GetRawData()
		if err == nil {
			bodyStr = string(bodyBytes)
			if len(bodyStr) > 500 {
				bodyStr = bodyStr[:500]
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"method":        c.Request.Method,
		"query":         c.Request.URL.Query(),
		"headers_count": len(c.Request.Header),
		"body":          bodyStr,
		"timestamp":     float64(time.Now().UnixMilli()) / 1000.0,
	})
}

// 根路径 - 测试页面
func handleRoot(c *gin.Context) {
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, testPageHTML())
}

func testPageHTML() string {
	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go 框架模式函数测试</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
               background: linear-gradient(135deg, #00ADD8, #5DC9E2); padding: 20px; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; border-radius: 16px; padding: 30px; margin-bottom: 20px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header h1 { color: #00ADD8; font-size: 32px; margin-bottom: 10px; }
        .header .version { color: #666; font-size: 14px; }
        .controls { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px;
               cursor: pointer; transition: all 0.3s; font-weight: 600; }
        .btn-primary { background: #00ADD8; color: white; }
        .btn-primary:hover { background: #0097b9; transform: translateY(-2px); }
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
            <h1>🔷 Go 框架模式测试</h1>
            <div class="version">Gin Framework | EdgeOne Pages Go Cloud Functions (Framework Mode)</div>
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
        var currentPath = window.location.pathname;
        var basePath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;

        var tests = [
            { id: 1, name: "基础信息", method: "GET", path: basePath + "/info", desc: "获取函数基本信息", check: "Go" },
            { id: 2, name: "健康检查", method: "GET", path: basePath + "/health", desc: "服务健康状态", check: "healthy" },
            { id: 3, name: "获取用户", method: "GET", path: basePath + "/users/1", desc: "GET 用户信息", check: "user_id" },
            { id: 4, name: "创建用户", method: "POST", path: basePath + "/users", desc: "POST 创建用户", body: {username: "测试", email: "test@example.com"}, check: "created" },
            { id: 5, name: "搜索功能", method: "GET", path: basePath + "/search?q=test&limit=5", desc: "查询参数搜索", check: "query" },
            { id: 6, name: "GET 回显", method: "GET", path: basePath + "/echo?msg=hello", desc: "回显请求信息", check: "method" },
            { id: 7, name: "POST 回显", method: "POST", path: basePath + "/echo", desc: "回显 POST 请求", body: {data: "test"}, check: "method" },
            { id: 8, name: "请求头", method: "GET", path: basePath + "/headers", desc: "查看请求头信息", check: "user_agent" },
            { id: 9, name: "当前时间", method: "GET", path: basePath + "/time", desc: "获取服务端时间", check: "timestamp" },
            { id: 10, name: "JSON 处理", method: "POST", path: basePath + "/json", desc: "处理 JSON 请求体", body: {name: "test", value: 42}, check: "received" },
            { id: 11, name: "错误处理", method: "GET", path: basePath + "/error", desc: "触发错误", expectError: true }
        ];

        var stats = { total: tests.length, passed: 0, failed: 0 };

        function initTests() {
            var grid = document.getElementById('testGrid');
            tests.forEach(function(test) {
                var card = document.createElement('div');
                card.className = 'test-card';
                card.id = 'test-' + test.id;
                card.innerHTML =
                    '<div class="test-header">' +
                        '<div class="test-icon" style="background: linear-gradient(135deg, #00ADD8, #5DC9E2); color: white;">' +
                            test.id +
                        '</div>' +
                        '<div class="test-title">' + test.name + '</div>' +
                        '<span class="test-method method-' + test.method + '">' + test.method + '</span>' +
                    '</div>' +
                    '<div class="test-desc">' + test.desc + '</div>' +
                    '<div class="test-url">' + test.path + '</div>' +
                    '<div class="test-status status-pending" id="status-' + test.id + '">⏸ 待运行</div>' +
                    '<div class="test-result" id="result-' + test.id + '" style="display: none;"></div>' +
                    '<div class="test-time" id="time-' + test.id + '"></div>';
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
            var statusEl = document.getElementById('status-' + test.id);
            var resultEl = document.getElementById('result-' + test.id);
            var timeEl = document.getElementById('time-' + test.id);

            statusEl.className = 'test-status status-running';
            statusEl.innerHTML = '⏳ 运行中...';
            resultEl.style.display = 'none';

            var startTime = Date.now();

            try {
                var opts = { method: test.method };
                if (test.body) {
                    opts.headers = { 'Content-Type': 'application/json' };
                    opts.body = JSON.stringify(test.body);
                }

                var res = await fetch(test.path, opts);
                var elapsed = Date.now() - startTime;

                var text = await res.text();
                var display = text;
                try { display = JSON.stringify(JSON.parse(text), null, 2); } catch(e) {}

                var success = test.expectError
                    ? (!res.ok)
                    : (res.ok && (!test.check || text.toLowerCase().includes(test.check.toLowerCase())));

                if (success) {
                    statusEl.className = 'test-status status-success';
                    statusEl.innerHTML = '✅ 通过';
                    stats.passed++;
                } else {
                    statusEl.className = 'test-status status-error';
                    statusEl.innerHTML = '❌ 失败';
                    stats.failed++;
                }

                resultEl.textContent = display.substring(0, 500) + (display.length > 500 ? '...' : '');
                resultEl.style.display = 'block';
                timeEl.textContent = '响应时间: ' + elapsed + 'ms | 状态码: ' + res.status;

            } catch(e) {
                statusEl.className = 'test-status status-error';
                statusEl.innerHTML = '❌ 失败';
                resultEl.textContent = '错误: ' + e.message;
                resultEl.style.display = 'block';
                stats.failed++;
            }

            updateStats();
        }

        async function runAllTests() {
            stats.passed = 0;
            stats.failed = 0;
            updateStats();

            for (var i = 0; i < tests.length; i++) {
                await runTest(tests[i]);
                await new Promise(function(resolve) { setTimeout(resolve, 300); });
            }
        }

        function clearResults() {
            tests.forEach(function(test) {
                var statusEl = document.getElementById('status-' + test.id);
                var resultEl = document.getElementById('result-' + test.id);
                var timeEl = document.getElementById('time-' + test.id);
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
</html>`
}
