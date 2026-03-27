"""
测试 maxDuration: sleep 15s，超过 edgeone.json 中配置的 10s 限制
"""
import json
import time
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        start = time.time()
        time.sleep(15)
        elapsed = int((time.time() - start) * 1000)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"elapsed": elapsed}).encode('utf-8'))
