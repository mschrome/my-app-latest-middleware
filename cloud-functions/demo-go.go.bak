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

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Hello from Go Functions on EdgeOne Pages!",
		"method":      r.Method,
		"path":        r.URL.Path,
		"timestamp":   time.Now().Format(time.RFC3339),
		"mode":        "handler",
		"description": "这是 handler 模式的 Go 云函数，仅支持单路由。如需多路由请使用框架模式（demo-go-framework.go.bak）",
	})
}
