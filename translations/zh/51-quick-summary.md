# 快速总结 {#quick-summary}

让我们回顾一下我们所学到的知识：

- **AI 系统设计** 构建在常规系统设计之上，但添加了一个新层：GPU、token、流式传输、非确定性以及每个请求的实际成本。
- **推理服务器** 是AI 系统的核心。它在 GPU 上运行 LLM 并提供预测。 **[vLLM](https://outcomeschool.com/blog/how-does-vllm-work)** 是默认值。 **[SGLang](https://outcomeschool.com/blog/how-does-sglang-work)** 最适合多轮和 RAG 工作负载。 **[TensorRT-LLM](https://outcomeschool.com/blog/how-does-tensorrt-llm-work)** 在 NVIDIA 上速度最快。 **[llama.cpp](https://outcomeschool.com/blog/how-does-llama-cpp-run-llms-on-everyday-hardware)** 在日常硬件上运行模型。
- **AI 硬件：** [GPUs](https://outcomeschool.com/blog/how-does-a-gpu-work-for-deep-learning) 是默认值，[TPUs](https://outcomeschool.com/blog/how-does-a-google-tpu-work) 是 Google 的 ML 芯片，[LPUs](https://outcomeschool.com/blog/how-does-an-lpu-work) 将模型保留在片上内存中，以实现非常快速的单用户速度。在写答案时，瓶颈是记忆，而不是数学。
- AI 中的 **延迟** 具有新的维度：TTFT、TPS（或 TPOT）和吞吐量。成本按三类计费：输入、输出和推理 token。
- **[Prefill 和 Decode](https://outcomeschool.com/blog/prefill-vs-decode-llm-inference-optimization)** 是推理的两个阶段。 预填充受计算限制并决定 TTFT。 解码受内存限制并决定 TPOT。 分块预填充和 [Prefill-解码 Disaggregation](https://outcomeschool.com/blog/prefill-decode-disaggregation) 阻止他们战斗。
- AI中的 **扩展** 在水平扩展之上使用张量并行和流水线并行，其中预热资源池用于自动扩缩容和token感知负载均衡。
- **缓存** 在AI中有四种风格：[KV缓存](https://outcomeschool.com/blog/kv-cache-in-llms)（由[Paged Attention](https://outcomeschool.com/blog/paged-attention-in-llms)管理并由[KV缓存压缩](https://outcomeschool.com/blog/kv-cache-compression)缩小）， [提示缓存](https://outcomeschool.com/blog/how-does-prompt-caching-work)、[语义缓存](https://outcomeschool.com/blog/how-does-semantic-caching-work)和[嵌入缓存](https://outcomeschool.com/blog/how-does-an-embedding-cache-work)。每种方法都以不同的方式节省成本。
- **[LLM 路由](https://outcomeschool.com/blog/llm-routing)** 将每个查询发送到正确的模型。基于规则、基于分类器、基于嵌入向量、LLM 作为路由器和级联是五种策略。
- **[Vector DB](https://outcomeschool.com/blog/how-does-a-vector-database-work)** 使用 [ANN search](https://outcomeschool.com/blog/how-does-approximate-nearest-neighbor-ann-search-work) 存储和搜索 [embeddings](https://outcomeschool.com/blog/what-are-embeddings)。 HNSW 适用于大多数应用程序，IVF+PQ（内存紧张时），DiskANN（索引无法容纳 RAM 时），ScaNN（十亿级）。
- **嵌入模型选择** 是一个高杠杆决策。 Matryoshka 嵌入向量让我们无需重新训练即可截断维度。
- **RAG** 是最常见的私有数据问答架构。文档解析、[chunking](https://outcomeschool.com/blog/chunking-strategies-for-rag)、[混合搜索](https://outcomeschool.com/blog/how-does-hybrid-search-work)、[HyDE](https://outcomeschool.com/blog/how-does-hyde-work)、[reranking](https://outcomeschool.com/blog/how-does-a-reranker-work)和[ColBERT](https://outcomeschool.com/blog/decoding-colbert) 使 RAG 变得更好。 [Agentic RAG](https://outcomeschool.com/blog/agentic-rag) 允许智能体驱动器检索。 [GraphRAG](https://outcomeschool.com/blog/graphrag) 添加了多跳问题的知识图。 [无向量 RAG](https://outcomeschool.com/blog/vectorless-rag) 让 LLM 可以像人读书一样浏览文档结构。
- **上下文窗口管理** 使用截断、汇总、滑动窗口、[compaction](https://outcomeschool.com/blog/how-does-context-compaction-work)或分层内存。 [上下文工程](https://outcomeschool.com/blog/context-engineering)与上下文腐化、[迷失在中间](https://outcomeschool.com/blog/lost-in-the-middle-problem-in-llms)和RoPE 衰减进行战斗。
- **[Streaming](https://outcomeschool.com/blog/how-does-token-streaming-work)** 对于任何面向用户的聊天都是必需的。我们使用 SSE 或 WebSocket。
- **A同步处理和消息队列** 处理长时间的AI任务，例如报告生成、文档索引、转录或长时间的智能体运行。
- AI 中的 **速率限制** 适用于每分钟 token、每分钟请求数、并发数和成本。
- **AI 网关** 是所有LLM 呼叫流经的单层。它为我们提供了多提供商故障转移、集中成本跟踪、速率限制、缓存、防护机制和可观测性于一处的功能。
- **[AI 智能体](https://outcomeschool.com/blog/ai-agent)** 由 LLM、指令、工具、记忆和一个 [执行循环](https://outcomeschool.com/blog/ai-agent-loop) 组成。LLM 推荐工具，由我们的代码，即 [Harness](https://outcomeschool.com/blog/harness-engineering-in-ai)，执行调用。常见模式有 [ReAct](https://outcomeschool.com/blog/react-agent)、[规划与执行](https://outcomeschool.com/blog/plan-and-execute-agent)、[反思](https://outcomeschool.com/blog/reflection-agent)、[Agentic RAG](https://outcomeschool.com/blog/agentic-rag) 和 [计算机使用智能体](https://outcomeschool.com/blog/how-do-computer-use-agents-work)。
- **[AI Orchestration](https://outcomeschool.com/blog/ai-orchestration)** 是开发人员定义的流，而智能体是 LLM 定义的流。 [Loop Engineering](https://outcomeschool.com/blog/what-is-loop-engineering) 设计智能体的循环，[Graph Engineering](https://outcomeschool.com/blog/what-is-graph-engineering) 将系统设计为节点和边。
- **[工具调用](https://outcomeschool.com/blog/how-does-function-calling-work-in-llms)** 让LLM要求我们的代码运行函数。 **[MCP](https://outcomeschool.com/blog/what-is-mcp-model-context-protocol)** 是将 AI 应用程序连接到工具和数据的通用标准。 **[A代理技能](https://outcomeschool.com/blog/what-are-agent-skills)** 通过逐步披露向智能体提供我们的专业知识。
- **结构化输出** 强制 LLM 返回与架构匹配的干净 JSON，因此输出可以在下一步中安全使用。
- **[Memory](https://outcomeschool.com/blog/ai-agent-memory)** 有四层：上下文窗口、短期、长期和外部知识。它使用四个核心操作：Write、Read、Update、Forget。
- **[多智能体系统s](https://outcomeschool.com/blog/multi-agent-systems)** 是多个智能体，其各自的重点角色一起工作，依靠专业化、沟通和协调。 [SubAgents](https://outcomeschool.com/blog/ai-subagents) 保持主上下文干净。 **A2A** 是跨供应商智能体通信的开放标准。
- **[多模态系统](https://outcomeschool.com/blog/multimodal-ai)** 添加图像、音频和视频。 **[Voice AI](https://outcomeschool.com/blog/design-a-real-time-voice-ai-agent)** 流式传输 STT -> LLM -> TTS，具有严格的延迟预算，并且必须处理打断。 **边缘 AI** 在设备上运行小型模型，通常以 [与云](https://outcomeschool.com/blog/cloud-vs-on-device-model-deployment) 的混合形式运行。
- **[Guardrails](https://outcomeschool.com/blog/how-do-llm-guardrails-work)** 保护我们免受幻觉和不安全输出的影响。 **[提示注入](https://outcomeschool.com/blog/prompt-injection-in-llms)** 采用最低权限、代码门、人工批准和双LLM模式进行防御。 **AI 红队测试** 在其他人之前攻击我们自己的系统。 **[LLM 水印](https://outcomeschool.com/blog/how-does-llm-watermarking-work)** 在生成的文本中隐藏可检测信号。
- **数据隐私和合规性** 使用 PII 修订、数据驻留、禁止训练条款、BAA 和审核日志来满足 GDPR、HIPAA 和 EU AI 法案的要求。
- AI 中的 **可观测性** 跟踪 token、成本、质量和工具调用。对于智能体、[轨迹和跨度](https://outcomeschool.com/blog/ai-agent-observability) 显示每一步。
- **评估管道** 取代AI中的单元测试。 [LLM 评估](https://outcomeschool.com/blog/llm-evaluation)、[LLM 作为评审模型](https://outcomeschool.com/blog/llm-as-a-judge) 和 [AI 智能体评估](https://outcomeschool.com/blog/ai-agent-evaluation) 告诉我们我们的更改是否是改进。
- **提示词管理** 将提示词视为代码：进行版本控制、测试并逐步推出。
- **成本优化** 是一项日常活动。使用更便宜的模型、提示词缓存、语义缓存、更短的输出、批量 API 和更好的检索。
- **多租户** 需要每租户限制、配额、成本跟踪和数据隔离，尤其是在缓存中。
- **[微调](https://outcomeschool.com/blog/how-does-fine-tuning-work)** 很少需要。 RAG 给出知识，微调给出行为。当我们做微调时，[LoRA](https://outcomeschool.com/blog/lora-low-rank-adaptation-of-llms)是最受欢迎的便宜选择。
- **[推理优化](https://outcomeschool.com/blog/llm-inference-optimization)** 使用[量化](https://outcomeschool.com/blog/how-does-model-quantization-work)、[连续批处理](https://outcomeschool.com/blog/continuous-batching-in-llms)、[推测解码](https://outcomeschool.com/blog/speculative-decoding)、 **测试时计算** 用于 [推理模型](https://outcomeschool.com/blog/large-reasoning-models)、[Flash 关注](https://outcomeschool.com/blog/decoding-flash-attention)、[混合专家模型](https://outcomeschool.com/blog/mixture-of-experts)、 [distillation](https://outcomeschool.com/blog/how-does-knowledge-distillation-work) 和 [分组查询关注](https://outcomeschool.com/blog/grouped-query-attention)。
- AI 中的 **容错** 使用超时、重试、降级回退模型、优雅降级和输出验证。
- **要解决任何AI 系统设计问题** ，请使用8步方法：需求、AI目标、数据准备、架构设计、模型选择和提示、评估、部署和服务、监控。

这是我们从头开始设计真正的AI 系统所需的一切。
