### 概述

Python 运行时函数是 EdgeOne Pages 提供的 Python 服务端运行能力，允许开发者使用 Python 编写后端逻辑，与前端页面部署在同一项目中，实现全栈应用开发。



### 优势
- **零配置部署**：基于文件系统自动生成路由，无需手动配置路由表。将 Python 文件放入 `cloud-functions` 目录即可自动映射为 API 端点。

- **多框架兼容**：同时支持 Handler 类、WSGI（Flask/Django）和 ASGI（FastAPI/Sanic）三种模式。框架自动检测，无需额外配置，还可在同一项目中混合使用不同模式。

- **智能依赖管理**：自动扫描代码中的 `import` 语句检测依赖，结合用户 `requirements.txt` 进行合并去重，支持增量安装和缓存优化，大幅提升构建速度。




### 开发模式

Python 函数支持多种开发模式：
<table>
<tr>
<td rowspan="1" colSpan="1" >模式</td>

<td rowspan="1" colSpan="1" >适用场景</td>

<td rowspan="1" colSpan="1" >路由方式</td>

<td rowspan="1" colSpan="1" >框架依赖</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >**Handler 模式**</td>

<td rowspan="1" colSpan="1" >简单 API、Serverless 风格</td>

<td rowspan="1" colSpan="1" >文件系统路由（文件即路由）</td>

<td rowspan="1" colSpan="1" >无（纯标准库）</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >**WSGI 框架模式**</td>

<td rowspan="1" colSpan="1" >完整 Web 应用、RESTful API</td>

<td rowspan="1" colSpan="1" >框架内置路由</td>

<td rowspan="1" colSpan="1" >Flask、Django</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >**ASGI 框架模式**</td>

<td rowspan="1" colSpan="1" >完整 Web 应用、RESTful API</td>

<td rowspan="1" colSpan="1" >框架内置路由</td>

<td rowspan="1" colSpan="1" >FastAPI、Sanic</td>
</tr>
</table>




### 快速开始

在项目的 `./cloud-functions/api` 目录下新建 `hello.py`，使用以下示例代码创建您的第一个 Python 函数：
``` bash
文件路径：./cloud-functions/api/hello.py
访问路径：https://example.com/api/hello
```

#### 基础示例：Handler 类
``` python
# ./cloud-functions/api/hello.py
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write('{"message": "Hello from Python Functions!"}'.encode('utf-8'))
```

`handler` 类继承自 `BaseHTTPRequestHandler`，通过 `do_GET`、`do_POST` 等方法处理不同的 HTTP 请求。

#### 进阶示例：使用 Flask 框架
``` python
# ./cloud-functions/api/index.py
# 访问路径：https://example.com/api/*
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/users', methods=['GET'])
def get_users():
    return jsonify({
        'users': [
            {'id': 1, 'name': 'Alice'},
            {'id': 2, 'name': 'Bob'}
        ]
    })

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    return jsonify({'message': 'User created', 'user': data}), 201
```

> **注意：**
> 

> 当使用框架模式时，运行时会自动剥离文件路由前缀。例如 `api/index.py` 对应路由前缀 `/api`，请求 `/api/users` 经剥离后 Flask 收到的路径为 `/users`，因此 Flask 内部路由只需定义相对路径即可。
> 


#### 进阶示例：使用 FastAPI 框架
``` python
# ./cloud-functions/api/index.py
# 访问路径：https://example.com/api/*
from fastapi import FastAPI

app = FastAPI()

@app.get('/items')
async def list_items():
    return {'items': [{'id': 1, 'name': 'Item A'}, {'id': 2, 'name': 'Item B'}]}

@app.get('/items/{item_id}')
async def get_item(item_id: int):
    return {'item_id': item_id, 'name': f'Item {item_id}'}

@app.post('/items')
async def create_item(item: dict):
    return {'message': 'Item created', 'item': item}
```



### 函数调试
1. **安装 EdgeOne CLI**：`npm install -g edgeone`

2. **本地开发**：在 Pages 代码项目下执行 `edgeone pages dev`，启动本地服务，进行函数调试

3. **函数发布**：代码推送到远端仓库，自动构建发布函数


   更多 EdgeOne CLI 的使用方式可参考 [EdgeOne CLI](https://write.woa.com/document/162228053883678720)。




### 路由

Python 函数基于 `/cloud-functions` 目录结构生成访问路由。您可在项目仓库 `/cloud-functions` 目录下创建任意层级的子目录，参考下述示例。

#### 目录结构示例
``` bash
...
cloud-functions
├── api
│   ├── index.py
│   ├── hello.py
│   ├── users
│   │   ├── index.py
│   │   ├── list.py
│   │   └── [id].py
│   ├── orders
│   │   └── index.py
│   └── [[default]].py
...
```

上述目录文件结构，经 EdgeOne Pages 平台构建后将生成以下路由。这些路由将 Pages URL 映射到 `/cloud-functions` 文件，当客户端访问 URL 时将触发对应的文件代码被运行：
<table>
<tr>
<td rowspan="1" colSpan="1" >文件路径</td>

<td rowspan="1" colSpan="1" >路由</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/index.py`</td>

<td rowspan="1" colSpan="1" >`example.com/api`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/hello.py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/hello`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/users/index.py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/users`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/users/list.py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/users/list`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/users/[id].py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/users/:id`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/orders/index.py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/orders`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`/cloud-functions/api/[[default]].py`</td>

<td rowspan="1" colSpan="1" >`example.com/api/*`</td>
</tr>
</table>


#### 路由匹配优先级

路由按以下优先级进行匹配（从高到低）：
1. **静态路由**：精确匹配的路径优先（如 `/api/users/list`）

2. **单级动态路由**：`[param]` 匹配单个路径段（如 `/api/users/[id]`）

3. **多级动态路由（Catch-all）**：`[[param]]` 匹配一个或多个路径段（如 `/api/[[default]]`）


   同级别路由中，路径越长（越具体）优先级越高。


#### 入口文件识别

并非所有 `.py` 文件都会被注册为路由。只有包含以下**入口标识**的 Python 文件才会生成路由：
- `class handler(BaseHTTPRequestHandler)` — Handler 类模式

- `app = Flask(...)` / `app = FastAPI(...)` — 框架实例模式

- `application = get_wsgi_application()` — Django WSGI 模式


   不包含入口标识的 `.py` 文件将被视为辅助模块，会被复制到构建产物中供其他入口文件引用，但不会注册为独立路由。


#### 动态路由

Python 函数支持动态路由。在文件名或目录名中使用方括号语法定义动态参数：
- **单级动态路径**`[param]`：匹配单个路径段

- **多级动态路径（Catch-all）**`[[param]]`：匹配一个或多个路径段

<table>
<tr>
<td rowspan="1" colSpan="1" >文件路径</td>

<td rowspan="1" colSpan="1" >路由</td>

<td rowspan="1" colSpan="1" >匹配示例</td>

<td rowspan="1" colSpan="1" >是否匹配</td>
</tr>

<tr>
<td rowspan="3" colSpan="1" >`/cloud-functions/api/users/[id].py`</td>

<td rowspan="3" colSpan="1" >`example.com/api/users/:id`</td>

<td rowspan="1" colSpan="1" >`example.com/api/users/1024`</td>

<td rowspan="1" colSpan="1" >✅ 是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`example.com/api/users/vip/1024`</td>

<td rowspan="1" colSpan="1" >❌ 否</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`example.com/api/vip/1024`</td>

<td rowspan="1" colSpan="1" >❌ 否</td>
</tr>

<tr>
<td rowspan="3" colSpan="1" >`/cloud-functions/api/[[default]].py`</td>

<td rowspan="3" colSpan="1" >`example.com/api/*`</td>

<td rowspan="1" colSpan="1" >`example.com/api/books/list`</td>

<td rowspan="1" colSpan="1" >✅ 是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`example.com/api/1024`</td>

<td rowspan="1" colSpan="1" >✅ 是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`example.com/v2/vip/1024`</td>

<td rowspan="1" colSpan="1" >❌ 否</td>
</tr>
</table>


#### 动态路由参数获取

在 Handler 类中，可通过 `self.path` 获取请求路径并解析动态参数：
``` python
# ./cloud-functions/api/users/[id].py
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # self.path 为未剥离前缀的路径
        user_id = self.path.strip('/')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(f'{{"user_id": "{user_id}"}}'.encode('utf-8'))
```

#### 框架内置路由

使用 Flask、FastAPI 等框架时，路由分为**文件系统路由**和**框架内部路由**两层：
1. **文件系统路由（外层）**：由文件路径决定，如 `api/index.py` → `/api`

2. **框架内部路由（内层）**：由框架代码定义，如 `@app.route('/users')`


   运行时会自动剥离文件系统路由前缀后再传给框架。例如：

- 请求路径 `/api/users`

- 文件系统路由匹配 `/api`（对应 `api/index.py`）

- 剥离前缀后，框架收到 `/users`

- Flask 的 `@app.route('/users')` 匹配成功
   

   > **注意：**
   > 
>   - 框架内部的路由定义不需要包含文件系统路由前缀。例如 api/index.py 中的 Flask 路由应写 @app.route('/users') 而非 @app.route('/api/users')
>   - 每个入口文件对应一个独立的框架实例，文件之间互不影响
>   - 同一个 index.py 中可以注册多个框架路由，运行时会将匹配该文件系统路由前缀的所有请求转发给同一个框架实例

- 框架内部的路由定义**不需要**包含文件系统路由前缀。例如 `api/index.py` 中的 Flask 路由应写 `@app.route('/users')` 而非 `@app.route('/api/users')`

- 每个入口文件对应一个独立的框架实例，文件之间互不影响

- 同一个 `index.py` 中可以注册多个框架路由，运行时会将匹配该文件系统路由前缀的所有请求转发给同一个框架实例


#### 框架示例：Flask 应用
``` python
# ./cloud-functions/api/index.py
# 文件系统路由：/api
# 框架内部路由：/users, /orders, /health
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/users')
def users():
    return jsonify({'users': []})

@app.route('/orders')
def orders():
    return jsonify({'orders': []})

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})
```

上述示例中，访问 `/api/users`、`/api/orders`、`/api/health` 都会路由到这个 Flask 应用。

#### 框架示例：FastAPI 应用
``` python
# ./cloud-functions/v2/index.py
# 文件系统路由：/v2
# 框架内部路由：/items, /items/{item_id}
from fastapi import FastAPI

app = FastAPI()

@app.get('/items')
async def list_items():
    return {'items': []}

@app.get('/items/{item_id}')
async def get_item(item_id: int):
    return {'item_id': item_id}
```

访问 `/v2/items` 和 `/v2/items/123` 都会路由到这个 FastAPI 应用。



### Function Handlers

使用 Function Handlers 可为 Pages 创建自定义请求处理程序，以及定义 RESTful API 实现全栈应用。Handler 类模式，无需依赖任何框架即可快速开发 API 接口。

#### 基本用法

Handler 类继承自 `BaseHTTPRequestHandler`，通过实现 `do_GET`、`do_POST` 等方法处理不同的 HTTP 请求：
``` python
# ./cloud-functions/api/hello.py
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write('Hello, world!'.encode('utf-8'))
```

#### 处理 POST 请求
``` python
# ./cloud-functions/api/users/index.py
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        # 读取请求体
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        # 解析 JSON
        data = json.loads(body) if body else {}
        
        # 返回响应
        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        response = json.dumps({'message': 'Created', 'data': data})
        self.wfile.write(response.encode('utf-8'))
```

#### 处理多种请求方法
``` python
# ./cloud-functions/api/items/index.py
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write('{"message": "Hello World"}'.encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(f'{{"received": {body}}}'.encode('utf-8'))

    def do_PUT(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write('{"message": "Updated"}'.encode('utf-8'))

    def do_DELETE(self):
        self.send_response(204)
        self.end_headers()
```

#### Handler 类属性和方法

`handler` 类继承自 `BaseHTTPRequestHandler`，可使用以下属性和方法：
<table>
<tr>
<td rowspan="1" colSpan="1" >属性/方法</td>

<td rowspan="1" colSpan="1" >类型</td>

<td rowspan="1" colSpan="1" >描述</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.path`</td>

<td rowspan="1" colSpan="1" >`str`</td>

<td rowspan="1" colSpan="1" >请求路径（含查询参数）</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.command`</td>

<td rowspan="1" colSpan="1" >`str`</td>

<td rowspan="1" colSpan="1" >HTTP 请求方法（GET、POST 等）</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.headers`</td>

<td rowspan="1" colSpan="1" >`dict-like`</td>

<td rowspan="1" colSpan="1" >请求头</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.rfile`</td>

<td rowspan="1" colSpan="1" >`file`</td>

<td rowspan="1" colSpan="1" >请求体输入流</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.wfile`</td>

<td rowspan="1" colSpan="1" >`file`</td>

<td rowspan="1" colSpan="1" >响应体输出流</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.send_response(code)`</td>

<td rowspan="1" colSpan="1" >method</td>

<td rowspan="1" colSpan="1" >发送 HTTP 状态码</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.send_header(key, value)`</td>

<td rowspan="1" colSpan="1" >method</td>

<td rowspan="1" colSpan="1" >发送响应头</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`self.end_headers()`</td>

<td rowspan="1" colSpan="1" >method</td>

<td rowspan="1" colSpan="1" >结束响应头</td>
</tr>
</table>


#### 获取查询参数
``` python
# ./cloud-functions/api/search.py
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        # 解析查询参数
        parsed = urlparse(self.path)
        query_params = parse_qs(parsed.query)
        
        # query_params 示例：{'name': ['Alice'], 'age': ['25']}
        name = query_params.get('name', ['Guest'])[0]
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(f'{{"hello": "{name}"}}'.encode('utf-8'))
```



### 依赖管理

#### 自动依赖检测

构建器会自动扫描 `cloud-functions` 目录下所有 Python 文件的 `import` 语句，检测使用的第三方库并自动添加到依赖列表。支持自动检测的常用框架和库包括：

`fastapi`、`django`、`sanic`、`bottle`、`falcon`、`httpx`、`requests`、`pydantic`、`sqlalchemy`、`redis`、`pymongo`、`numpy`、`pandas` 等。

#### 手动声明依赖

如果需要指定精确版本或自动检测未覆盖的依赖，可在以下位置放置 `requirements.txt`：
1. `cloud-functions/requirements.txt`（优先使用）

2. 项目根目录 `requirements.txt`

   ``` txt
   # cloud-functions/requirements.txt
   flask>=2.0.0
   redis>=4.0.0
   openai>=1.0.0
   ```

   构建时会将基础依赖、自动检测的依赖和用户声明的依赖**合并去重**，用户显式声明的版本具有最高优先级。


#### 排除目录

以下目录不会被扫描和复制到构建产物中：
- `__pycache__`、`.git`、`node_modules`

- `venv`、`.venv`（虚拟环境）

- `scripts`（本地测试脚本）

- `tests`、`.pytest_cache`（测试文件）




### 使用限制
<table>
<tr>
<td rowspan="1" colSpan="1" >内容</td>

<td rowspan="1" colSpan="1" >限制</td>

<td rowspan="1" colSpan="1" >说明</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >代码包大小</td>

<td rowspan="1" colSpan="1" >128 MB</td>

<td rowspan="1" colSpan="1" >单个函数代码包大小（含依赖）最多支持 128 MB</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >请求 body 大小</td>

<td rowspan="1" colSpan="1" >6 MB</td>

<td rowspan="1" colSpan="1" >客户端请求携带 body 最多支持 6 MB</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >单次运行时长</td>

<td rowspan="1" colSpan="1" >120s</td>

<td rowspan="1" colSpan="1" >墙上时间（wall time）</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >运行时版本</td>

<td rowspan="1" colSpan="1" >Python 3.10</td>

<td rowspan="1" colSpan="1" >服务端运行环境为 Python 3.10，建议本地开发也使用相同版本</td>
</tr>
</table>


> **注意：**
> 

> 涉及到文件传输时，不建议存储需要长期保留的数据，推荐使用腾讯云 COS 来处理持久化的需求
> 




### 日志分析

Pages 控制台提供了基础的日志查看功能，开发者可以查看 Python 函数调用的基本日志信息，通过日志快速发现并解决 API 调用中的异常或错误。

详细指引可查看文档 [日志分析](https://write.woa.com/document/187318188356812800)。



### 示例模板

**Python Handler 模板：**

预览地址：[https://mysql-template.edgeone.run](https://mysql-template.edgeone.run)

源码地址：[https://github.com/TencentEdgeOne/python-handler-template](https://github.com/TencentEdgeOne/python-handler-template)



**使用 FastApi 框架：**

预览地址：[https://express-template.edgeone.run](https://express-template.edgeone.run/)

源码地址：[https://github.com/TencentEdgeOne/python-fastapi-template](https://github.com/TencentEdgeOne/python-fastapi-template)



**使用 Flask 框架：**

预览地址：[https://express-template.edgeone.run](https://express-template.edgeone.run/)

源码地址：[https://github.com/TencentEdgeOne/python-flask-template](https://github.com/TencentEdgeOne/python-flask-template)



**使用 Django 框架：**

预览地址：[https://express-template.edgeone.run](https://express-template.edgeone.run/)

源码地址：[https://github.com/TencentEdgeOne/python-django-template](https://github.com/TencentEdgeOne/python-django-template)



**使用 Sanic 框架：**

预览地址：[https://express-template.edgeone.run](https://express-template.edgeone.run/)

源码地址：[https://github.com/TencentEdgeOne/python-sanic-template](https://github.com/TencentEdgeOne/python-sanic-template)





