# 真实系统案例 {#real-world-ai-system-case-studies}

现在，让我们看看本指南中的构建块如何组合到我们每天使用的实际产品中。

## 案例研究 1：Claude Code 的工作原理 {#case-study-1-how-claude-code-works}

[Claude Code](https://outcomeschool.com/blog/how-does-claude-code-work) 是来自 Anthropic 的编码智能体，在终端中运行。我们用简单的英语给它一个任务，它通过阅读我们的代码、编辑文件、运行命令和检查自己的工作来完成任务。

其核心是具有三相的智能体环路：

```
              +------------------+
              |   Your request   |
              +------------------+
                       |
                       v
              +------------------+
    +-------->|  Gather context  |
    |         +------------------+
    |                  |
    |                  v
    |         +------------------+
    |         |   Take action    |
    |         +------------------+
    |                  |
    |                  v
    |         +------------------+
    |         |  Verify results  |
    |         +------------------+
    |                  |
    +---- not done ----+
                       | done
                       v
              +------------------+
              |  Task complete   |
              +------------------+
```

在这里，我们可以看到本指南的构建块：

- **智能体循环和 Harness:** 收集上下文、采取操作、验证结果并重复直至完成。
- **工具调用:** 搜索文件、读取文件、编辑文件和运行命令的工具为其提供了眼睛和双手。
- **验证：** 它运行测试或程序以检查更改是否实际有效。通过的测试是机器可检查的完成定义。
- **记忆：** `CLAUDE.md` 文件保存加载到每个会话中的项目内存。
- **防护机制:** 权限决定哪些操作在运行之前需要我们的批准。
- **子智能体:** 大搜索在具有自己上下文的子智能体中运行，因此主上下文保持干净。
- **上下文压缩:** 长时间会话经过总结，以便智能体可以持续工作数小时。
- **智能体技能和 MCP:** 技能为其提供了我们的工作方式，MCP 将其连接到外部工具。

## 案例 2：Cursor 如何工作 {#case-study-2-how-cursor-works}

[Cursor](https://outcomeschool.com/blog/how-does-cursor-work) 是一款带有人工智能大脑的代码编辑器。这是 RAG 和模型路由协同工作的一个很好的例子。

- **RAG 在我们的代码库上：** 游标将我们的代码分解为文本块（就像每个函数一样），将每个文本块转换为嵌入向量，并将它们存储在向量数据库中。当我们询问“在哪里检查用户的密码？”时，它会按含义进行搜索并将匹配的代码发送到 LLM。
- **按作业进行模型路由：** 对于不同的作业使用不同的模型。

| 工作 | 使用的模型 | 为什么使用 |
| ------------------- | ------------------------- | --------------------------------------------------------------- |
| Tab 自动补全 | 小型快速模型 | 用户输入时，建议必须立即出现。 |
| 聊天和智能体 | 一个大而智能的模型 | 艰苦的思考和代码编写需要最智能的模型。 |
| 应用更改 | 小型、快速的应用模型 | 将所描述的更改合并到文件中是一项简单、快速的任务。 |

在这里，我们可以看到每个模型都有一个明确的工作。大模型进行深入思考。小模型可以处理快速任务。这种组合使产品既智能又快速。

## 案例研究 3：设计实时语音 AI 智能体 {#case-study-3-design-a-real-time-voice-ai-agent}

应答支持呼叫的语音智能体是当今最常见的 AI 系统设计问题之一。它将流媒体、编排、工具调用、延迟预算和电话技术结合在一个系统中。

```
   User (Phone / Mobile App / Browser)
                 |
                 |  audio stream in both directions
                 |  (SIP/RTP for phone, WebRTC for app and browser)
                 v
   +-----------------------------------+
   |        Media Gateway (Edge)       |
   |  handles call setup, codecs,      |
   |  echo cancellation, jitter buffer |
   +-----------------------------------+
                 |
                 |  clean audio chunks (20 ms each)
                 v
   +-----------------------------------+
   |    Voice Agent Orchestrator       |
   |     (one session per call)        |
   |                                   |
   |  Voice Activity Detection (VAD)   |
   |  Turn Detection                   |
   |  Speech-to-Text (streaming)   --> |---> STT Service (GPU)
   |  LLM + Tools (streaming)      --> |---> LLM Service (GPU)
   |  Text-to-Speech (streaming)   --> |---> TTS Service (GPU)
   |  Interruption Handling            |
   +-----------------------------------+
          |                  |
          v                  v
   +--------------+   +---------------------------+
   | Tools / APIs |   | Storage                   |
   | (order DB,   |   | (recordings, transcripts, |
   |  booking,    |   |  logs, metrics)           |
   |  CRM, etc.)  |   +---------------------------+
   +--------------+
```

在这里， **媒体网关** 是与电话网络或应用程序通信并清理音频的入口点。 **Voice 智能体 Orchestrator** 是系统的核心，每个呼叫都有一个会话。它决定用户何时结束讲话，将音频流传输到 STT，将文本传输到 LLM，将回复传输到 TTS，并处理中断。 STT、LLM 和 TTS 服务在 GPU 上运行，并由许多调用共享。

对于规模，假设我们每天接到 100 万个电话，平均时长为 5 分钟。这意味着每秒大约有 12 个调用，并且在任何时刻大约有 12 x 300 = 3,600 个调用正在进行。在高峰期，我们可以假设是 3 倍，大约 10,000 个并发呼叫，每个呼叫都需要一个流式 STT 会话、一个 LLM 会话和一个流式 TTS 会话。因此，成本主要是 GPU 成本，这就是为什么我们尽可能使用小而快速的模型。

完整设计见我们的详细文章：[如何设计实时语音 AI 智能体](https://outcomeschool.com/blog/design-a-real-time-voice-ai-agent)。
