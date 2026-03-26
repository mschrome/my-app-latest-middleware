### 概述

Go 运行时函数旨在简化后端开发流程，提供与前端项目无缝集成的 Go 运行时。
- **功能**：支持处理 HTTP 请求，使用标准库 `net/http` 或主流 Go Web 框架构建 API。

- **集成**：可在统一项目中构建和部署动态 API 及复杂业务逻辑。

- **运维**：平台自动处理版本控制、构建与部署，并根据业务负载智能扩容。




### 优势
- **高性能 Go 运行时**：编译型语言天然的性能优势，启动快、内存占用低。

- **全栈开发体验**：无需分离前后端项目，可在同一项目中完成开发和部署。

- **路由即服务**：Handler 模式下，通过文件系统定义 API 路由，像管理前端页面一样管理后端逻辑。

- **框架自由选择**：支持 Gin、Echo、Fiber、Chi 主流 Web 框架，也支持纯标准库 `net/http`。

- **零配置构建**：自动检测框架、自动处理路由映射、自动交叉编译，无需手动配置。




### 开发模式

Go 函数提供两种开发模式，可根据项目需求选择其中一种模式，不能混合使用：
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
<td rowspan="1" colSpan="1" >**Framework 模式**</td>

<td rowspan="1" colSpan="1" >完整 Web 应用、RESTful API</td>

<td rowspan="1" colSpan="1" >框架内置路由</td>

<td rowspan="1" colSpan="1" >Gin / Echo / Fiber 等</td>
</tr>
</table>


### 

### 快速开始

### Handler 模式 — 示例

在项目的 `./cloud-functions/` 目录下新建 `hello.go`：
- **文件路径**：`./cloud-functions/hello.go`

- **访问路径**：`example.com/hello`

   ``` go
   package handler
   
   import (
       "encoding/json"
       "net/http"
   )
   
   func Handler(w http.ResponseWriter, r *http.Request) {
       w.Header().Set("Content-Type", "application/json")
       json.NewEncoder(w).Encode(map[string]string{
           "message": "Hello from Go Functions on EdgeOne Pages!",
       })
   }
   ```   

   > **说明：**
   > 

   > Handler 模式下，每个 `.go` 文件需要导出一个 handler 函数，导出函数必须符合 [http.HandlerFunc](https://pkg.go.dev/net/http#HandlerFunc) 签名类型，函数名可以是任意合法的 Go 导出函数名。
   > 




### Framework 模式 — Gin 框架示例

**零配置、开箱即用**：Framework 模式的核心理念是直接使用**框架原生写法**，无需任何适配代码。只需按照框架官方文档正常编写代码，平台会在构建时自动完成端口适配、路径映射等所有适配工作。


- **文件路径**：`./cloud-functions/api.go`

- **访问路径**：`example.com/api/v1/hello`、`example.com/api/v1/users` 等

   ``` go
   package main
   
   import (
       "net/http"
       "github.com/gin-gonic/gin"
   )
   
   func main() {
       r := gin.Default()
   
       // REST API v1 group
       v1 := r.Group("/v1")
       {
           v1.GET("/hello", func(c *gin.Context) {
               c.JSON(http.StatusOK, gin.H{
                   "message": "Hello from Gin on EdgeOne Pages!",
               })
           })
   
           users := v1.Group("/users")
           {
               users.GET("", listUsersHandler)
               users.GET("/:id", getUserHandler)
               users.POST("", createUserHandler)
           }
       }
   
       r.Run(":9000")
   }
   ```

   **路径说明**：入口文件名 `api.go` 决定了前端访问需要加 `/api` 前缀，如果入口文件名为 `index.go`，则无需额外前缀。


### 

### 函数调试

前提本地已安装 Go 环境
1. 安装 EdgeOne CLI：`npm install -g edgeone`

2. 本地开发：在 Pages 代码项目下执行 `edgeone pages dev`，启动本地服务，进行函数调试

3. 函数发布：代码推送到远端仓库，自动构建发布函数


   更多 EdgeOne CLI 的使用方式可参考[文档](https://write.woa.com/document/162228053883678720)。




### 路由

Go Functions 基于 `/cloud-functions` 目录结构生成访问路由。您可在项目仓库 /cloud-functions 目录下创建任意层级的子目录，参考下述示例。
``` bash
...
cloud-functions
├── index.go
├── hello-pages.go
├── helloworld.go
├── api
    ├── users
      ├── list.go
      ├── geo.go
      ├── [id].go
    ├── visit
      ├── index.go
    ├── [[default]].go
...
```

上述目录文件结构，经 EdgeOne Pages 平台构建后将生成以下路由。这些路由将 Pages URL 映射到 `/cloud-functions` 文件，当客户端访问 URL 时将触发对应的文件代码被运行：
<table>
<tr>
<td rowspan="1" colSpan="1" >文件路径</td>

<td rowspan="1" colSpan="1" >路由</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >/cloud-functions/index.go</td>

<td rowspan="1" colSpan="1" >example.com/</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >/cloud-functions/hello-pages.go</td>

<td rowspan="1" colSpan="1" >example.com/hello-pages</td>
</tr>
</table>




**动态路由**

Cloud Functions 支持动态路由，上述示例中一级动态路径 /cloud-functions/api/users/[id].go，多级动态路径 /cloud-functions/api/[[default]].go。参考下述用法：
<table>
<tr>
<td rowspan="1" colSpan="1" >文件路径</td>

<td rowspan="1" colSpan="1" >路由</td>

<td rowspan="1" colSpan="1" >匹配</td>
</tr>

<tr>
<td rowspan="3" colSpan="1" >/cloud-functions/api/users/[id].go</td>

<td rowspan="1" colSpan="1" >example.com/api/users/1024</td>

<td rowspan="1" colSpan="1" >是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >example.com/api/users/vip/1024</td>

<td rowspan="1" colSpan="1" >否</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >example.com/api/vip/1024</td>

<td rowspan="1" colSpan="1" >否</td>
</tr>

<tr>
<td rowspan="3" colSpan="1" >/cloud-functions/api/[[default]].go</td>

<td rowspan="1" colSpan="1" >example.com/api/books/list</td>

<td rowspan="1" colSpan="1" >是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >example.com/api/1024</td>

<td rowspan="1" colSpan="1" >是</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >example.com/v2/vip/1024</td>

<td rowspan="1" colSpan="1" >否</td>
</tr>
</table>




**框架路由**

Framework 模式下，路由完全由框架自身管理，你只需按照框架的原生路由写法正常注册即可。平台不会分析或干预框架内部的路由定义，而是生成一条 **catch-all** 规则，将匹配到的所有请求转发给 Go 服务。



**入口文件名决定 URL 前缀：**
<table>
<tr>
<td rowspan="1" colSpan="1" >入口文件名</td>

<td rowspan="1" colSpan="1" >URL 前缀</td>

<td rowspan="1" colSpan="1" >前端调用路径示例</td>

<td rowspan="1" colSpan="1" >框架内部路由</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`index.go`</td>

<td rowspan="1" colSpan="1" >`/`（无前缀）</td>

<td rowspan="1" colSpan="1" >`/v1/hello`</td>

<td rowspan="1" colSpan="1" >`/v1/hello`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`main.go`</td>

<td rowspan="1" colSpan="1" >`/main`</td>

<td rowspan="1" colSpan="1" >`/main/v1/hello`</td>

<td rowspan="1" colSpan="1" >`/v1/hello`</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >`api.go`</td>

<td rowspan="1" colSpan="1" >`/api`</td>

<td rowspan="1" colSpan="1" >`/api/v1/hello`</td>

<td rowspan="1" colSpan="1" >`/v1/hello`</td>
</tr>
</table>


> **说明：**
> 

> 当入口文件不是 index.go 时，前端访问需要加文件名前缀，但框架内部路由不需要改动，请求到达框架时前缀已被剥离，你的框架代码始终保持原生写法，无需感知平台的路径映射。
> 




### 使用限制
<table>
<tr>
<td rowspan="1" colSpan="1" >**内容**</td>

<td rowspan="1" colSpan="1" >**限制**</td>

<td rowspan="1" colSpan="1" >**说明**</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >代码包大小</td>

<td rowspan="1" colSpan="1" >128 MB</td>

<td rowspan="1" colSpan="1" >单个函数代码包大小最多支持 128 MB</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >请求 body 大小</td>

<td rowspan="1" colSpan="1" >6 MB</td>

<td rowspan="1" colSpan="1" >客户端请求携带 body 最多支持 6 MB</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >单次运行时长</td>

<td rowspan="1" colSpan="1" >120s</td>

<td rowspan="1" colSpan="1" >墙上时间</td>
</tr>

<tr>
<td rowspan="1" colSpan="1" >开发语言</td>

<td rowspan="1" colSpan="1" >Go</td>

<td rowspan="1" colSpan="1" >运行环境版本 1.26（向前兼容）</td>
</tr>
</table>


> **注意：**
> 

> 涉及到文件传输时，不建议存储需要长期保留的数据，推荐使用腾讯云 COS 来处理持久化的需求
> 




### 日志分析

Pages 控制台提供了基础的日志查看功能，开发者可以查看 Go 函数调用的基本日志信息，通过日志快速发现并解决 API 调用中的异常或错误。详细指引可查看文档 [日志分析](https://write.woa.com/document/187318188356812800)。



### 示例模板

**Go Handler 模板：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-handler-template](https://github.com/TencentEdgeOne/go-handler-template)



**使用 Gin 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-gin-template](https://github.com/TencentEdgeOne/go-gin-template)



**使用 Echo 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-echo-template](https://github.com/TencentEdgeOne/go-echo-template)



**使用 Chi 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-chi-template](https://github.com/TencentEdgeOne/go-chi-template)



**使用 Fiber 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-fiber-template](https://github.com/TencentEdgeOne/go-fiber-template)



**使用 Httprouter 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-httprouter-template](https://github.com/TencentEdgeOne/go-httprouter-template)



**使用 Mux 框架：**

预览地址：

源码地址：[https://github.com/TencentEdgeOne/go-mux-template](https://github.com/TencentEdgeOne/go-mux-template)