# 常见问题 {#ai-system-design-faqs}

## AI 系统设计是什么？ {#what-is-ai-system-design-1}

AI 系统设计是围绕人工智能模型设计完整系统的学科，特别是大语言模型 (LLM)，以便它能够以快速、廉价、可靠、安全和可测量的方式为真实用户服务。它涵盖推理服务器、GPU、缓存、RAG、向量数据库、AI 智能体、防护机制、评估、可观测性和成本。

## AI 系统设计与普通系统设计有何不同？ {#how-is-ai-system-design-different-from-regular-system-design-1}

所有常规的系统设计概念（例如负载均衡器、缓存、队列和数据库）仍然适用。除此之外，AI 系统设计处理 GPU、token、长流响应、非确定性输出以及每个请求的实际成本。因此，我们以不同的方式使用相同的构建块，并添加新的构建块，例如推理服务器、向量数据库、AI 网关、防护机制和评估。

## AI 系统设计面试最重要的主题是什么？ {#what-are-the-most-important-topics-for-an-ai-system-design-interview}

最重要的主题是推理服务器和 GPU、预填充和解码、TTFT 和吞吐量、KV 缓存和提示词缓存、语义缓存、LLM 路由、具有混合搜索功能的 RAG 和重排序、AI 智能体与工具调用和 MCP、多智能体系统、流媒体、速率限制、AI 网关、防护机制和提示注入、使用 LLM 评审、可观测性进行评估以及成本估算。本指南涵盖了所有这些内容。

## 如何回答 AI 系统设计面试问题？ {#how-do-i-answer-an-ai-system-design-interview-question}

遵循本指南中的 8 个步骤框架：需求、AI 目标、数据准备、架构设计、模型选择和提示、评估、部署和服务以及监控。从最简单、可行的设计开始，仅在需求需要时才增加复杂性。

## 我什么时候应该使用 RAG，什么时候应该使用微调？ {#when-should-i-use-rag-and-when-should-i-use-fine-tuning}

RAG 为模型提供了新的知识，例如我们公司的文档。 微调为模型提供了新的行为，例如格式、语气或狭义技能。对于大多数应用程序，更好的提示加上 RAG 就足够了。仅当我们的任务非常狭窄且有大量高质量的训练数据时，微调才值得。

## 我什么时候应该使用 AI 智能体，什么时候应该使用固定工作流程？ {#when-should-i-use-an-ai-agent-and-when-should-i-use-a-fixed-workflow}

当预先知道步骤时，使用固定工作流程（AI Orchestration）。它更可预测、更便宜且更易于调试。仅当无法提前知道步骤并且 LLM 必须决定下一步做什么时才使用 AI 智能体。在实际系统中，我们经常在整个流程中使用固定的工作流程，并在一个开放式步骤中使用智能体。

## 我们如何降低 LLM 应用程序的成本？ {#how-do-we-reduce-the-cost-of-an-llm-application}

将简单的查询路由到更便宜的模型，使用提示词缓存来处理长时间重复的提示词，使用语义缓存来处理重复的问题，保持输出简短，使用批处理 API 来处理非紧急作业，在 RAG 中检索更少但更好的文本块，并为大批量简单任务自行托管小型模型。

## 我们如何减少 LLM 应用程序的延迟？ {#how-do-we-reduce-the-latency-of-an-llm-application}

流式传输响应，使用提示词缓存来减少 TTFT，尽可能选择更小或更快的模型，保持提示词较短，在自托管模型上使用推测解码和量化，并部署在靠近用户的位置。对于语音智能体，流式传输每个阶段并重叠它们。

## MCP、A2A 和智能体技能之间有什么区别？ {#what-is-the-difference-between-mcp-a2a-and-agent-skills}

MCP 将智能体连接到工具和数据源。 A2A 将智能体作为对等体连接到其他智能体。 智能体技能为智能体提供我们的专业知识、步骤和格式，仅在需要时加载。它们是互补的，而不是竞争的。

## 我们如何保护 AI 智能体免受提示注入的影响？ {#how-do-we-protect-an-ai-agent-from-prompt-injection}

假设模型将被劫持，并设计系统以使被劫持的模型仍然不会造成严重损害。给予智能体最小的特权，将每条硬性规则放在代码中而不是提示词中，在不可逆转的操作之前询问人员，将传出链接和网络调用列入白名单，将不受信任的数据与具有工具的模型分开，记录所有内容，并在每次发布之前进行红队。

## 谁创建了本 AI 系统设计指南？ {#who-created-this-ai-system-design-guide}

本 AI 系统设计指南由 [Outcome School](https://outcomeschool.com) 的创始人 Amit Shekhar 编写和维护。他教导和指导了许多开发人员，他们的努力为他们带来了高薪技术工作，帮助许多技术公司解决了他们的独特问题，并创建了许多被顶级公司使用的开源库。

---

如果这篇AI 系统设计指南对您有帮助，请给它一个star⭐，并分享给您想学习AI 系统设计的朋友和同事。

为人工智能工程面试做好准备：[AI 工程面试问题](https://github.com/amitshekhariitbhu/ai-engineering-interview-questions)

一步步学习AI工程：[AI工程课程](https://github.com/amitshekhariitbhu/ai-engineering-course)

加入 Outcome School 的 [AI 和机器学习](https://outcomeschool.com/program/ai-and-machine-learning) 计划，深入学习所有这些内容。

[**在这里阅读我们所有的高质量博客。**](https://outcomeschool.com/blog)
