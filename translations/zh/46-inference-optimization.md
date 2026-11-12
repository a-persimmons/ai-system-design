# 推理优化 {#inference-optimization}

一旦我们的模型投入生产，我们仍然希望使其更快、更便宜。现代推理服务器使用以下技术的组合。我们有一篇关于 [LLM 推理优化](https://outcomeschool.com/blog/llm-inference-optimization) 的详细博客，其中介绍了所有这些内容。

让我列出哪种技术有助于哪个阶段，以便您更好地理解。

| 技术 | 主要目标 | 改进了什么 |
| --------------------- | ---------------------------------- | ------------------------------------------------------ |
| KV 缓存 | 解码 | 通过避免重新计算使解码更快 |
| 连续批处理 | 两个阶段 | 提高吞吐量，同时服务更多用户 |
| 分块预填充 | 为其他用户提供流畅服务 | 防止长预填充导致正在进行的流式传输停止 |
| 前缀缓存 | 预填充 | TTFT（跳过冗余提示词处理） |
| 分离部署 | 两个阶段 | 大规模场景下独立优化 TTFT 和 TPOT |
| 推测解码 | 解码 | 降低 TPOT，更快生成 token |
| PagedAttention | KV 缓存内存 | 吞吐量（批量更大，浪费更少） |

当我们想要更快的第一个单词时，我们会查看预填充一侧。当我们想要更快的流媒体或同时拥有更多用户时，我们会考虑解码一侧。

## 量化 {#quantization}

模型将其权重存储为 16 位或 32 位浮点数。 [**模型量化**](https://outcomeschool.com/blog/how-does-model-quantization-work)将这些压缩为8位甚至4位。模型变得更小、速度更快，但质量略有下降。

示例：16 位的 Llama 70B 需要 140 GB。 4 位时仅需要 35 GB。现在它可以安装在单个 A100 中，而不是需要 2 个。

量化也直接加速了解码。请记住，解码受内存带宽限制。较小的权重意味着每个 token 从内存中移动的数据较少。

常见的量化格式：INT8、FP8、AWQ、GPTQ、[GGUF](https://outcomeschool.com/blog/how-does-gguf-work)。

## 连续批处理 {#continuous-batching}

在简单的设置中，推理服务器会一一处理请求。 GPU 未得到充分利用。

在[连续批处理](https://outcomeschool.com/blog/continuous-batching-in-llms)中，服务器同时处理许多请求，并在每一步将它们打包在一起。一旦一个请求完成，一个新的请求就会填补该批次中的位置。 GPU 保持忙碌状态。

原始批次和连续批处理之间的区别如下所示：

```
Naive batching (the whole batch waits for the slowest request)

   Step 1:  [ R1  R2  R3  R4 ]    all four generating tokens
   Step 2:  [ R1  R2  R3  R4 ]    R3 finishes its last token
   Step 3:  [ R1  R2  --  R4 ]    R3's slot now wasted
   Step 4:  [ R1  --  --  R4 ]    R2 finishes, slot 2 also wasted
   Step 5:  [ --  --  --  R4 ]    R1 finishes, only R4 remains
   Step 6:  [ R5  R6  R7  R8 ]    R4 finally finishes; new batch starts


Continuous batching (vLLM-style)

   Step 1:  [ R1  R2  R3  R4 ]    all four generating tokens
   Step 2:  [ R1  R2  R3  R4 ]    R3 finishes
   Step 3:  [ R1  R2  R5  R4 ]    R5 fills the slot immediately
   Step 4:  [ R1  R6  R5  R4 ]    R2 finishes -> R6 fills it
   Step 5:  [ R7  R6  R5  R4 ]    R1 finishes -> R7 fills it
            ...                    GPU stays full at every step
```

这是推理优化方面最大的胜利。 vLLM之所以出名，是因为它对连续批处理的研究非常出色。

## 推测解码 {#speculative-decoding}

[**推测解码**](https://outcomeschool.com/blog/speculative-decoding) 是一种技术，我们首先快速猜测接下来的几个 token，然后要求大模型在一次运行中验证所有这些猜测。我们使用一个小的快速模型（草稿模型）来预测接下来的几个token，然后大模型（目标模型）一步步验证它们。大多数时候，小模型是正确的，所以我们节省了很多大模型的pass。

为什么这有效？因为解码受内存带宽限制。一次检查 4 个 token 的成本几乎与生成 1 个 token 相同，因为最大的成本是从内存中读取权重，而不是数学。

流程如下所示：

```
Step 1: Small draft model proposes K tokens (fast)

   Draft model -> "The cat sat on"      (K = 4 tokens, cheap)


Step 2: Big model verifies all K tokens in ONE forward pass (in parallel)

   Big model  -> [verify "The"] [verify "cat"] [verify "sat"] [verify "on"]
                     accept        accept        reject         (skip)
                                                   |
                                                   v
                                       Big model's correction: "ran"


Step 3: Keep the accepted prefix + the correction

   Output: "The cat ran"      (3 tokens produced using 1 big-model pass)
```

在这里，我们可以看到仅使用 1 个昂贵的大模型通道（而不是 3 个）生成了 3 个 token。草稿正确的时间越长，节省的费用就越大。

这使得同一 GPU 上的生成速度提高了 2 倍到 3 倍。通过正确的接受规则（拒绝采样），输出质量与单独的大模型完全相同。

有几种方法可以进行猜测：

- **草稿模型：** 来自同一系列的小型模型提出了token。经典的方法。
- **[N-gram 推测](https://outcomeschool.com/blog/n-gram-speculation-in-llms):** 根本没有额外的模型。它通过查找提示词中已经看到的文本来猜测下一个 token。非常适合从输入中复制大量内容的任务，例如代码编辑、摘要和 RAG。
- **[Medusa](https://outcomeschool.com/blog/decoding-medusa):** 向大模型本身添加几个额外的头，每个头一次猜测不同的未来 token。
- **[EAGLE](https://outcomeschool.com/blog/decoding-eagle):** 特征级别（模型的内部数字）而不是 token 级别的草稿，这可以提供更准确的猜测。

**注：** 推测解码在 GPU 有空闲计算（这意味着批量大小为中低）时帮助最大。当批量大小非常高时，GPU 已经很忙，并且增益会变小。

## 测试时计算（推理时间缩放） {#test-time-compute-inference-time-scaling}

现在，让我们讨论如何使模型变得更智能的最大变化之一。直到 2024 年，唯一已知的杠杆就是让模型更大并训练更长时间。到 2026 年，我们有第二个杠杆：当模型实际回答问题时，在推理时花费更多计算。这称为 **测试时计算** 或 **推理时间缩放** 。

[L 大型推理模型 (LRM)](https://outcomeschool.com/blog/large-reasoning-models) 像 OpenAI 的 o1 和 o3 以及 DeepSeek-R1 一样，是第一个大规模使用此模型的。它们每次查询生成的 token 比普通聊天模型多 10 倍到 100 倍，其中大多数 token 隐藏在模型回答之前“思考”模型生成的 token 上。结果是：对于相同的模型大小，难题（数学、代码、科学）的质量显着提高。

有以下三种常见模式：

- **顺序缩放：** 模型一步步思考，越来越长，然后才给出答案。这就是推理模型内部所做的事情。
- **并行缩放：** 并行运行模型多次并选择最佳的（或对它们进行投票）。当我们可以验证答案时（通过测试的代码、数学证明）就很好了。
- **混合缩放：** 结合两者。产生许多平行的思想链，然后选择最一致的。

这三种模式如下所示：

```
Sequential scaling (one long thinking chain)

   Question --> [think... think... think... think...] --> Answer


Parallel scaling (many short chains, vote or pick best)

   Question --+-> [think...] --> Answer 1 --+
              |                              |
              +-> [think...] --> Answer 2 --+--> Pick best / Vote --> Answer
              |                              |
              +-> [think...] --> Answer 3 --+


Hybrid scaling (many long chains, most consistent wins)

   Question --+-> [think long...] --> Answer 1 --+
              |                                   |
              +-> [think long...] --> Answer 2 --+--> Most consistent --> Answer
              |                                   |
              +-> [think long...] --> Answer 3 --+
```

系统设计含义：

- **推理需求爆炸式增长。** 行业预测到 2026 年推理需求将远远超过训练需求（一些硬件供应商的报价为 100 倍或更多）。我们需要围绕推理而非训练来规划 GPU 容量。
- **批处理更困难。** 一次推理请求可能生成 50,000 个输出 token。如果将它与只生成 200 个 token 的聊天请求放进同一批次，吞吐量会大幅下降。
- **两类硬件资源池。** 许多团队为普通聊天部署快速资源池，并为推理请求部署独立的资源池。
- **每请求预算。** 更多思考通常能改善推理质量，但成本也会线性增长。生产系统会为每个请求设置 token 预算，达到上限后停止模型。
- **用户体验。** 推理可能需要 30 秒到数分钟。可以展示“思考中……”的等待动画，或在思考结束后流式输出可见答案。

要点很简单：2026 年系统设计的重大挑战已不再是如何扩展训练，而是如何在不耗尽月度预算的情况下，为每个查询提供更多思考时间。

## FlashAttention {#flash-attention}

[FlashAttention](https://outcomeschool.com/blog/decoding-flash-attention) 是当今几乎所有现代 LLM 中最重要的优化之一。它计算的注意力与 Transformer 原本使用的 **完全相同** ，但速度更快、内存效率更高。它不改变数学原理，也不改变结果，只改变注意力在 GPU 上的 **计算方式** 。

简单来说， **FlashAttention 用更高效的 GPU 计算方式，算出相同的注意力结果。**

要理解这为什么重要，先要了解 GPU 的存储层次。GPU 有两类存储：

- **HBM（高带宽内存）：** 容量大，但相对较慢，可以存放数十 GB 数据；与计算速度相比，读取速度较慢。
- **SRAM（静态RAM）：** 小但速度非常快的片上存储器。从 SRAM 读取大约比从 HBM 读取快 10 到 20 倍，但它只能容纳几百 KB。

将 HBM 视为另一层楼的大型图书馆，将 SRAM 视为我们面前的一张小桌子。步行去图书馆需要时间。在桌子上阅读是即时的。

标准注意力会在 HBM 中创建一个巨大的 N×N 注意力分数矩阵，N 为 token 数。4,000 个 token 对应 1,600 万个元素，100,000 个 token 则对应 100 亿个元素。进行 softmax 和与 V 的矩阵乘法时，这个矩阵要被反复读取、写回、再读取。GPU 并不是计算太慢，而是大部分时间都在等待数据从较慢的内存中到达。

FlashAttention 说： **为什么要在 HBM 中存储巨大的 N×N 矩阵？让我们在适合 SRAM 的小块（平铺）中计算注意力，并且永远不要将完整矩阵写入 HBM。** 它使用一种名为 **online softmax** 的巧妙技巧，通过跟踪运行最大值和运行总和来逐块计算 softmax，最终结果与标准 softmax 相同。

让我们用 4,000 token 的实数来看待这一点：

- **标准注意力：** ~6400万个条目在HBM和SRAM之间移动
- **FlashAttention:** 移动了约 1700 万条条目

数据移动量大约降至原来的四分之一，序列越长，差距越大。对于长序列，FlashAttention 通常比标准注意力 **快 2 到 4 倍**，而且 **输出完全相同**，没有质量损失。这使今天的长上下文窗口成为可能。**FlashAttention 2** 和 **FlashAttention 3** 进一步改进，在现代硬件上获得更高的 GPU 利用率。

我个人认为 FlashAttention 是现代人工智能中最优雅的系统工程之一。它需要相同的数学运算，保持相同的结果，并且仍然使所有内容在相同的硬件上运行得更快。它让我们的生活更轻松。

## 混合专家模型（MoE） {#mixture-of-experts-moe}

[Mixture of Experts](https://outcomeschool.com/blog/mixture-of-experts) 是一种架构技巧，让我们无需支付全部推理成本即可构建巨大的模型。许多当今最强大的 LLM（Mixtral、DeepSeek-V3 和几个前沿模型）均在内部使用 MoE。

简单来说：

**混合专家模型 = 许多小型专家网络 + 选择使用哪些网络的路由器。**

把它想象成一家医院。医院没有一位医生可以治疗每一位患者。它有许多专家——心脏专家、皮肤专家、大脑专家。当病人走进来时，接待员（路由器）将他们发送给正确的专家（专家）。患者不需要见每个医生。他们只遇到与他们的问题相关的人。

在 Transformer 内部，MoE 将 [前馈](https://outcomeschool.com/blog/feed-forward-networks-in-llms) 子层替换为 **许多小专家** 并排坐着 - 8 个专家，64 个专家，甚至 128 个专家。一个小型 **router** 网络对每个 token 的所有专家进行评分，并选择 **top-k** （通常是前 2 名）。只有选出的专家才能运行。其他专家都闲着看token。

这是路由器挑选专家的简单视觉。假设对于这个 token，路由器选择 **E3** 和 **E5** ：

```
                          Token
                            |
                         Router
                            |
         +------+------+----+----+------+------+
         |      |      |         |      |      |
         v      v      v         v      v      v
        E1     E2   [ E3 ]      E4   [ E5 ]   ... E8
                      |                |
                      v                v
                    Out_3            Out_5
                       \             /
                        \           /
                         \         /
                       Weighted Sum
                         (Combined)
                             |
                             v
                          Output
```

只有选出的专家才能运行。剩下的就闲着吧。最终输出是所选专家输出的加权和，其中权重来自路由器的分数。

这意味着模型可以具有巨大的总参数数量，但每个 token 仅使用一小部分。 **Mixtral 8x7B** 有 8 位专家，总大小约为 470 亿个参数，但每个 token 中只有约 130 亿个活跃参数。该模型像 13B 模型一样快，但像 47B 模型一样智能。

对于 AI 系统设计，MoE 很重要，因为它改变了我们的成本和产能数字。我们必须为 **总参数** 规划 GPU 内存（所有专家都必须加载到内存中），但我们的计算预算由 **活动参数** 设置（只有选定的专家在每个 token 上运行）。因此，我们获得了一个非常大的模型的智能，同时支付了一个小得多的模型的每 token 计算费用。

## 模型蒸馏 {#model-distillation}

现在，让我们看看另一种加快速度的方法。到目前为止，我们已经讨论了如何让同一个模型运行得更快。还有另一种选择：用经过训练可以复制大模型行为的较小模型替换大模型。

这称为[**知识蒸馏**](https://outcomeschool.com/blog/how-does-knowledge-distillation-work)（或简称蒸馏）。

简而言之， **蒸馏就是训练一个小型“学生”模型，模仿大型“教师”模型。**

流程很直接：首先选择一个规模大、成本高的教师模型，例如 GPT-5.5 或 Claude Opus 4.8；向它输入大量提示词，收集答案和软概率分布；随后训练小型学生模型，使它对相同输入产生相同输出；最后将学生模型部署到生产环境。

学生模型的规模通常小 10 到 100 倍，成本更低、速度更快。对于特定任务，它的质量可以达到或非常接近教师模型。DeepSeek-R1 的蒸馏版本就是近期知名案例：模型小到能在笔记本电脑上运行，却在许多基准测试中接近 GPT-4 级别的推理能力。

蒸馏与量化不同。量化保留同一个模型，降低权重的数值精度；蒸馏则创建一个全新的、更小的模型。

适合使用蒸馏的情况：

- 任务范围明确且调用量大，例如分类、摘要或信息提取。
- 大模型的每 token 成本过高。
- 希望在边缘设备上运行模型。
- 需要稳定可预测的低延迟。

限制在于：蒸馏主要适合范围明确的任务，小型学生模型无法在所有能力上匹敌大型教师模型。如果需要通用智能，应继续使用大模型。

## 分组查询注意力（GQA） {#grouped-query-attention-gqa}

在标准 [多头注意力](https://outcomeschool.com/blog/multi-head-attention-in-transformers) 中，每个注意力头都有自己的 Q、K 和 V。这有利于模型质量，但会让推理时的 KV 缓存非常大。例如，一个具有 64 个注意力头、上下文长度为 100,000 token 的模型，其 KV 缓存会十分庞大。

[分组查询注意力](https://outcomeschool.com/blog/grouped-query-attention) 保留原有的 Query 集合，但让一组注意力头共享一个 Key 和一个 Value。这样能大幅减小 KV 缓存，同时使质量非常接近多头注意力。

简单来说， **分组查询注意力让多个注意力头共享 Key 和 Value，以显著更小的 KV 缓存实现接近多头注意力的质量。**

这在生产环境中很重要：KV 缓存更小，就意味着同一块 GPU 可以同时服务更多使用长上下文的用户。

正是这些技术共同作用，使现代推理服务器能以合理的成本和延迟处理 100 万 token 的上下文。
