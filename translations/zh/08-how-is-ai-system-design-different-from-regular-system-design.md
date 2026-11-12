# 与常规系统设计的区别 {#how-is-ai-system-design-different-from-regular-system-design}

在常规的[系统设计](https://outcomeschool.com/blog/system-design)中，我们处理CPU、RAM、磁盘、数据库和网络。

在 AI 系统设计中，我们处理所有这些，最重要的是，我们处理：

- **GPU：** LLM 在 GPU 上运行，而不是在 CPU 上运行。 GPU 价格昂贵且数量有限。
- **token:** LLM 不适用于字符。他们与 token 一起工作。输入和输出均按 token 计费。
- **长请求：** 单个 LLM 调用可能需要 30 秒甚至几分钟。常规 API 以毫秒为单位返回。
- **流式传输：** LLM 的响应是 [逐个 token 流式输出](https://outcomeschool.com/blog/how-does-token-streaming-work) 的，而不是一次性返回一大段内容。
- **非确定性输出：** 相同的输入可以给出不同的输出。我们不能像常规代码一样进行单元测试。
- **每个请求的成本：** 每个 API 调用都需要花费真钱。循环中的一个错误可能会在一夜之间烧掉数千美元。

因此，所有常规系统设计概念（负载均衡器、缓存、队列、数据库）仍然适用。但我们必须以不同的方式使用它们，因为工作量不同。
