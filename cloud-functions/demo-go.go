package handler

import (
	"encoding/json"
	"net/http"
	"time"
)

// Handler 是云函数入口 - handler 模式（单路由）
// 访问路径: /demo-go
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Powered-By", "Go Cloud Function")

	// 从请求头中获取平台注入的 region 信息
	region := r.Header.Get("X-Edgeone-Server-Region")
	if region == "" {
		region = r.Header.Get("X-Server-Region")
	}
	if region == "" {
		region = "unknown"
	}

	// 收集所有请求头，用于调试查看平台注入的上下文信息
	headers := make(map[string]string)
	for name, values := range r.Header {
		if len(values) > 0 {
			headers[name] = values[0]
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Hello from Go Functions on EdgeOne Pages!",
		"method":      r.Method,
		"path":        r.URL.Path,
		"timestamp":   time.Now().Format(time.RFC3339),
		"mode":        "handler",
		"region":      region,
		"headers":     headers,
		"description": "这是 handler 模式的 Go 云函数，仅支持单路由。如需多路由请使用框架模式（demo-go-framework.go.bak）",
	})
}
