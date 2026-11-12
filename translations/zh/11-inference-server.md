# 推理服务器 {#inference-server}

在常规系统设计中，服务器运行应用代码并返回响应。

在 AI 系统设计中，有一种称为 **推理服务器** 的组件。

推理服务器是一种运行 LLM 的专用服务器。它将模型加载到 GPU 显存中，并处理预测请求。我们有一篇关于 [模型服务（Model Serving）](https://outcomeschool.com/blog/model-serving) 的详细文章，逐步解释模型服务的工作方式。

大多数团队不会从零编写推理服务器，而是使用知名的开源实现，例如：

- **[vLLM](https://outcomeschool.com/blog/how-does-vllm-work)：** 最受欢迎的开源推理服务器。
- **TGI（文本生成推理）：抱脸构建的**
- **[SGLang](https://outcomeschool.com/blog/how-does-sglang-work):** 非常快推理服务器
- **[TensorRT-LLM](https://outcomeschool.com/blog/how-does-tensorrt-llm-work):** 由 NVIDIA 构建

当我们使用 OpenAI 或 Anthropic API 时，我们不会运行推理服务器。我们通过互联网致电他们的推理服务器。

当我们运行自己的 LLM（如 Llama 或 Mistral）时，我们在 GPU 机器上运行 vLLM 或 TGI，我们的后端调用此推理服务器。

所以架构如下所示：

```
Client -> Backend Server -> Inference Server (with GPU) -> LLM
```

推理服务器是AI 系统中最重的组件。它需要 GPU。 GPU 很昂贵。单个 H100 GPU 的购买成本约为 25,000 至 40,000 美元（具体取决于变体，例如 PCIe 与 SXM 以及供应商），或者每小时租赁费用约为 2 至 4 美元。

这里，类比很简单。一个普通的服务员就像一个有几个厨师的厨房。 推理服务器就像一个厨房，配有一位非常昂贵的厨师（GPU）。我们不想让这位厨师闲着一秒钟。

这就是为什么在AI 系统设计中，我们投入了大量的精力：

- 让 GPU 满负荷运行（这样我们就不会浪费钱）
- 缓存响应（这样我们就不会一次又一次地调用 GPU）
- 将廉价请求路由到廉价模型

## 选择推理引擎 {#choosing-an-inference-engine}

现在，让我们看看要使用哪个推理引擎。我们将在生产中看到四种主要的推理引擎。每个人都有一个甜蜜点。

- **[vLLM](https://outcomeschool.com/blog/how-does-vllm-work):** 采用最广泛、社区支持最多、硬件支持最广泛（NVIDIA、AMD、Intel、AWS Trainium）。以两个大技巧而闻名 - **[Paged Attention](https://outcomeschool.com/blog/paged-attention-in-llms)** （KV 缓存的更智能 GPU 内存管理）和 **[连续批处理](https://outcomeschool.com/blog/continuous-batching-in-llms)** （保持由于将许多请求打包在一起，GPU 已满）。我们稍后将详细解释两者。大多数团队的默认选择。在初始部署中最多可提高 24 倍吞吐量。
- **[SGLang](https://outcomeschool.com/blog/how-does-sglang-work):** 较新的引擎。在 H100 上的较小模型（7B 至 8B）上，吞吐量通常高于 vLLM，具体取决于工作负载。特别适合多轮对话、结构化输出和 RAG 等前缀密集的管道，因为它在请求之间重用共享前缀的 KV 缓存。在较大的 70B+ 模型上，差距缩小。
- **[TensorRT-LLM](https://outcomeschool.com/blog/how-does-tensorrt-llm-work):** NVIDIA 自家引擎。它提前为模型将运行的具体 GPU 做好准备，而不是即时计算出结果。 LLM 在 NVIDIA GPU 上进行推理的最快选项之一，但它将我们与 NVIDIA 生态系统紧密联系在一起。当我们致力于 NVIDIA 基础设施并需要最大吞吐量和最低延迟时，最好使用。
- **TGI（文本生成推理）：** 曾经是自托管 Hugging Face 模型的默认值。截至 2025 年 12 月，Hugging Face 将 TGI 移至维护模式，现在将新部署指向 vLLM 或 SGLang。
- **[llama.cpp](https://outcomeschool.com/blog/how-does-llama-cpp-run-llms-on-everyday-hardware):** 不是数据中心引擎。它通过使用 [quantization](https://outcomeschool.com/blog/how-does-model-quantization-work) 缩小模型并在 CPU 和 GPU 之间共享工作，在笔记本电脑、台式机或小型服务器等日常硬件上运行 LLM。它加载以 [GGUF](https://outcomeschool.com/blog/how-does-gguf-work) 格式存储的模型，这是一个独立的文件，包含运行模型所需的一切。像 **[Ollama](https://outcomeschool.com/blog/how-does-ollama-work)** 这样的工具是在它之上构建的，因此我们可以使用单个命令在本地下载并运行模型。

经验法则：

- 默认为 **vLLM** 。
- 如果我们的工作负载是多轮聊天、结构化输出或 RAG（跨请求的高前缀重叠），请移至 **SGLang** 。
- 仅当我们仅使用 NVIDIA 并且额外的速度值得锁定时，才转向 **TensorRT-LLM** 。
- 当我们想要在本地、单台计算机或边缘运行模型时，请使用 **llama.cpp** 。

现在，我们知道根据我们的用例使用哪个推理引擎。
