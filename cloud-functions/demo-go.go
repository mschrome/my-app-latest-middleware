package cloudfunction

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Handler 是云函数入口，使用标准 net/http Handler 接口
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Powered-By", "Go Cloud Function")

	switch r.URL.Path {
	case "/", "":
		handleRoot(w, r)
	case "/health":
		handleHealth(w, r)
	case "/info":
		handleInfo(w, r)
	case "/echo":
		handleEcho(w, r)
	case "/time":
		handleTime(w, r)
	default:
		handleNotFound(w, r)
	}
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	resp := map[string]string{
		"message": "Hello from Go Cloud Function!",
		"runtime": "go",
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"type":      "go_function",
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleInfo(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"name":        "Go Cloud Function Demo",
		"runtime":     "go",
		"description": "最简单的 Go 云函数示例",
		"features": []string{
			"标准 net/http 接口",
			"JSON 响应",
			"路由处理",
		},
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleEcho(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"method":      r.Method,
		"path":        r.URL.Path,
		"query":       r.URL.RawQuery,
		"host":        r.Host,
		"remote_addr": r.RemoteAddr,
		"timestamp":   time.Now().Unix(),
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleTime(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	resp := map[string]interface{}{
		"timestamp": now.Unix(),
		"iso":       now.Format(time.RFC3339),
		"formatted": now.Format("2006-01-02 15:04:05"),
	}
	writeJSON(w, http.StatusOK, resp)
}

func handleNotFound(w http.ResponseWriter, r *http.Request) {
	resp := map[string]interface{}{
		"error":  "Not Found",
		"path":   r.URL.Path,
		"method": r.Method,
	}
	writeJSON(w, http.StatusNotFound, resp)
}

func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		fmt.Fprintf(w, `{"error": "Failed to encode response"}`)
	}
}
