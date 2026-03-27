"""
Python Cloud Function - BaseHTTPRequestHandler
A lightweight serverless function using standard Python BaseHTTPRequestHandler.
"""
import json
import time
import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


class handler(BaseHTTPRequestHandler):
    """
    Python function handler.
    Uses BaseHTTPRequestHandler for request/response handling.
    """

    # ============ HTTP Method Entry Points ============

    def do_GET(self):
        """Handle all GET requests"""
        path, query = self._parse_path()

        # Route dispatch
        if path == '/' or path == '':
            self._handle_root()
        elif path == '/health':
            self._handle_health()
        elif path == '/info':
            self._handle_info()
        elif path == '/time':
            self._handle_time()
        elif path == '/echo':
            self._handle_echo(query)
        elif path == '/headers':
            self._handle_headers()
        elif path == '/search':
            self._handle_search(query)
        elif path.startswith('/users/'):
            user_id = path.split('/users/')[1].split('/')[0]
            self._handle_get_user(user_id)
        else:
            self._send_json(404, {"error": "Not Found", "path": path, "method": "GET"})

    def do_POST(self):
        """Handle all POST requests"""
        path, query = self._parse_path()
        body = self._read_body()

        if path == '/echo':
            self._handle_echo_post(query, body)
        elif path == '/json':
            self._handle_json_body(body)
        elif path == '/users':
            self._handle_create_user(body)
        else:
            self._send_json(404, {"error": "Not Found", "path": path, "method": "POST"})

    # ============ Utility Methods ============

    def _parse_path(self):
        """Parse request path and query parameters"""
        parsed = urlparse(self.path)
        path = parsed.path

        # Remove function prefix, e.g., /api/info -> /info
        base_prefix = '/api'
        if path.startswith(base_prefix):
            path = path[len(base_prefix):] or '/'

        query = {}
        for key, values in parse_qs(parsed.query).items():
            query[key] = values[0] if len(values) == 1 else values

        return path, query

    def _read_body(self):
        """Read request body"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            return self.rfile.read(content_length).decode('utf-8')
        return ''

    def _send_json(self, status_code, data, extra_headers=None):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('X-Powered-By', 'Python Cloud Function')
        if extra_headers:
            for key, value in extra_headers.items():
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _get_headers_dict(self):
        """Convert request headers to dictionary"""
        return {key.lower(): value for key, value in self.headers.items()}

    # ============ Route Handlers ============

    def _handle_root(self):
        """Root path handler"""
        self._send_json(200, {
            "message": "Hello from Python Cloud Function!",
            "framework": "BaseHTTPRequestHandler",
            "timestamp": time.time()
        })

    def _handle_health(self):
        """Health check endpoint"""
        self._send_json(200, {
            "status": "healthy",
            "timestamp": time.time(),
            "type": "python_cloud_function"
        })

    def _handle_info(self):
        """Function information endpoint"""
        self._send_json(200, {
            "name": "Python Cloud Function",
            "framework": "BaseHTTPRequestHandler",
            "description": "A lightweight serverless function using standard Python BaseHTTPRequestHandler",
            "features": [
                "Standard Python format",
                "BaseHTTPRequestHandler class",
                "do_GET / do_POST method dispatch",
                "Built-in path parsing and query handling"
            ]
        })

    def _handle_time(self):
        """Return current server time"""
        now = datetime.datetime.now()
        self._send_json(200, {
            "timestamp": time.time(),
            "iso": now.isoformat(),
            "formatted": now.strftime("%Y-%m-%d %H:%M:%S"),
        })

    def _handle_echo(self, query):
        """GET echo - return request information"""
        headers = self._get_headers_dict()
        self._send_json(200, {
            "method": "GET",
            "query": query,
            "headers_count": len(headers),
            "body": None,
            "timestamp": time.time()
        })

    def _handle_echo_post(self, query, body):
        """POST echo - return request information"""
        headers = self._get_headers_dict()
        self._send_json(200, {
            "method": "POST",
            "query": query,
            "headers_count": len(headers),
            "body": body[:500] if body else None,
            "timestamp": time.time()
        })

    def _handle_headers(self):
        """Return request headers information"""
        headers = self._get_headers_dict()
        self._send_json(200, {
            "user_agent": headers.get('user-agent', 'unknown'),
            "content_type": headers.get('content-type', 'none'),
            "accept": headers.get('accept', 'none'),
            "host": headers.get('host', 'unknown'),
            "all_headers": headers
        })

    def _handle_search(self, query):
        """Search functionality"""
        q = query.get('q', '')
        limit = int(query.get('limit', '10'))
        offset = int(query.get('offset', '0'))

        if not q:
            self._send_json(400, {"error": "Query parameter 'q' is required"})
            return

        results = [
            {"id": i, "name": f"Result {i}", "score": round(0.95 - i * 0.08, 2)}
            for i in range(offset, offset + min(limit, 10))
        ]

        self._send_json(200, {
            "query": q,
            "limit": limit,
            "offset": offset,
            "count": len(results),
            "results": results
        })

    def _handle_json_body(self, body):
        """Handle JSON request body"""
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        self._send_json(200, {
            "message": "JSON received and parsed",
            "received": data,
            "keys": list(data.keys()),
            "size": len(body)
        })

    def _handle_get_user(self, user_id):
        """Get user by ID"""
        try:
            uid = int(user_id)
        except ValueError:
            self._send_json(400, {"error": "Invalid user ID"})
            return

        self._send_json(200, {
            "user_id": uid,
            "username": f"user_{uid}",
            "email": f"user{uid}@example.com",
            "source": "python_cloud_function"
        })

    def _handle_create_user(self, body):
        """Create a new user"""
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON body"})
            return

        if 'username' not in data:
            self._send_json(400, {"error": "Username is required"})
            return

        self._send_json(201, {
            "message": "User created",
            "user": {
                "id": 12345,
                "username": data['username'],
                "email": data.get('email', ''),
            }
        })
