# LLM 基础回顾 {#llm-recap}

在介绍 AI 系统设计之前，让我们快速回顾一下 LLM 是什么。

LLM 代表 **大语言模型** 。它是一个以一些文本作为输入并预测下一个 token 的模型。它会一次又一次地执行此操作，直到生成完整的响应。我们有一篇关于 [LLM 如何工作？](https://outcomeschool.com/blog/large-language-model-llm) 的详细博客。

文本不会直接交给模型，而是先切分为称为 **token** 的小单元。可以把它想象成一整块巧克力：整块是句子，掰下的每一小块就是一个 token。模型一次可以处理多个 token。详细解释见 [LLM 中的分词](https://outcomeschool.com/blog/tokenization-in-llms)。大多数现代 LLM 使用 [BPE（字节对编码）](https://outcomeschool.com/blog/bpe-in-llms) 进行分词。一个 token 大约对应 4 个英文字符，因此“AI”“Hello”这类常见短词通常是一个 token，“Bangalore”这类较长词可能是两个 token，而“ChatGPT”这类组合名称可能是 2 到 3 个 token，具体取决于分词器。

LLM 一次生成文本 **一个 token** 。这称为 [**自回归**](https://outcomeschool.com/blog/autoregressive-models) 生成，这意味着模型不断将自己的输出反馈回作为新输入。假设我们为模型提供以下输入：

```
"I love"
```

模型查看“I”和“love”，预测下一个 token 为“teaching”。完整序列变为“I love teaching”。模型接着查看“I”“love”和“teaching”，预测下一个 token 为“AI”，于是序列变为“I love teaching AI”。这个过程每次生成一个 token，直到模型决定停止。

每一步中，模型都不能确定下一个 token 是什么。它会为每个可能的 token 分配一个概率，再从中选择一个。[Temperature（温度）](https://outcomeschool.com/blog/how-does-temperature-control-llm-output) 和 [Top-k、Top-p 采样](https://outcomeschool.com/blog/how-do-top-k-and-top-p-sampling-work) 等设置控制这一选择过程。这也是同一提示词可能产生不同输出的原因，而这一点正是 AI 系统设计与常规系统设计的重要区别之一。

LLM 的内部是一个 [Transformer](https://outcomeschool.com/blog/decoding-transformer-architecture)，由多层注意力层和前馈层堆叠而成。其中最重要的概念是 **注意力机制** ：每个 token 都会转换为三个向量—— **查询（Query，Q）** 、 **键（Key，K）** 和 **值（Value，V）** ——并利用它们判断，预测下一个 token 时哪些先前的 token 最重要。我们有一篇关于 [注意力背后的数学：Q、K 和 V](https://outcomeschool.com/blog/math-behind-attention-qkv) 的详细文章，逐步讲解其中的数学原理。

使用 OpenAI、Anthropic 或 Google 等提供的 API 时，我们发送一个提示词，然后收到逐个 token 返回的流式响应。

LLM 的例子包括：GPT-5.5、Claude Opus 4.8、Gemini 3.5、Llama 4、Mistral。

如果想深入了解 LLM 的内部原理——分词、位置编码、Q/K/V 矩阵、注意力、Transformer 架构、KV 缓存、分页注意力和混合专家模型——Outcome School 的 [AI 与机器学习课程](https://outcomeschool.com/program/ai-and-machine-learning) 会从零讲解这些内容。

基础回顾到这里就够了。现在进入真正的系统设计部分。
