# 流式响应 {#streaming-responses}

在常规 API 中，服务器会在工作完成后发送一个响应。

在人工智能领域，我们不能等待完整的回应。较长的答案可能需要 30 秒。用户不能盯着空白屏幕 30 秒。

所以我们 **流式输出** 的响应。一旦 LLM 生成 token，我们就会将其发送给用户。用户看到文本逐字出现。这称为 [**token 流**](https://outcomeschool.com/blog/how-does-token-streaming-work)。

常规响应和流式响应之间的区别如下所示：

```
Regular HTTP (no streaming)

   Client                       Server
     |                            |
     | --- request -------------> |
     |                            |  (model generates 500 tokens)
     |                            |  ...
     |                            |  ~10 seconds later
     | <-- full response -------- |
     |     (all 500 tokens)       |


Streaming (SSE)

   Client                       Server
     |                            |
     | --- request -------------> |
     | <-- "Once" --------------- |  ~800 ms (TTFT)
     | <-- " upon" -------------- |
     | <-- " a" ----------------- |
     | <-- " time" -------------- |
     |        ...                 |
     | <-- " end" --------------- |  ~10 seconds total
     | <-- [DONE] --------------- |
     |                            |
```

在流式传输中，用户在 TTFT（不到一秒）处看到第一个 token，并观察响应的建立。在常规 HTTP 响应中，用户盯着空白屏幕 10 秒钟，然后所有内容立即显示。流媒体让缓慢的 LLM 感觉很快。它工作完美。

有两种主要的流式传输方式。我们有一篇关于 [HTTP 请求、长轮询、WebSocket 和 SSE](https://outcomeschool.com/blog/http-request-long-polling-websocket-sse) 的单独详细博客，深入解释了这些内容。

## 服务器发送事件 (SSE) {#server-sent-events-sse}

这是最常见的方式。客户端打开 HTTP 连接，服务器保持连接，并在数据块就绪后持续写入。每个数据块都是一条以 `data:` 开头的小消息，最后以特殊的 `[DONE]` 标记结束。这是 ChatGPT 网页端采用的方式。

## WebSockets {#websockets}

双向流连接。当我们还需要在中途接收来自客户端的消息时使用（例如取消请求或发送更多上下文）。

流媒体改变了我们后端的很多事情：

- 连接必须保持很长时间（有时是几分钟）。
- 我们不能使用 30 秒超时的普通负载均衡器。我们需要配置较长的超时。
- 我们需要优雅地处理断开连接（用户关闭选项卡）。
