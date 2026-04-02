package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Handler - Go 超时测试: sleep 8s (maxDuration=10s, 应通过)
// 访问路径: /test-timeout-go-25
func Handler(w http.ResponseWriter, r *http.Request) {
	sleepSeconds := 8
	fmt.Printf("[GO-SLEEP] Starting sleep for %d seconds...\n", sleepSeconds)

	startTime := time.Now()
	time.Sleep(time.Duration(sleepSeconds) * time.Second)
	elapsed := time.Since(startTime).Seconds()

	fmt.Printf("[GO-SLEEP] Woke up after %.2f seconds\n", elapsed)

	w.Header().Set("Content-Type", "application/json"
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":         fmt.Sprintf("Go function slept for %d seconds", sleepSeconds),
		"requested_sleep": sleepSeconds,
		"actual_elapsed":  fmt.Sprintf("%.2fs", elapsed),
		"max_duration":    "10s (configured in edgeone.json)",
		"within_limit":    sleepSeconds <= 10,
		"timestamp":       time.Now().Format(time.RFC3339),
	})
}
