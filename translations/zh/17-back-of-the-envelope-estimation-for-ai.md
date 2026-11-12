# 容量与成本估算 {#back-of-the-envelope-estimation-for-ai}

在 AI 系统设计采访中，我们估计了三件事：

1. token 估计
2. GPU 估计
3. 存储估计（针对向量 DB、嵌入向量、日志）

让我们举个例子。我们正在构建一个类似 ChatGPT 的产品。假设我们有 1000 万日活跃用户，每个用户每天有 5 个对话，平均每个对话有 2000 个输入 token 和 500 个输出 token。

## token 估计 {#token-estimation}

```
Daily input tokens  = 10 million * 5 * 2000 = 100 billion tokens per day
Daily output tokens = 10 million * 5 * 500  = 25  billion tokens per day
Total tokens per day = 125 billion tokens
```

## GPU 估计 {#gpu-estimation}

假设一个 H100 GPU 可以在 Llama-70B 级模型上生成 5000 个每秒 token 数。

```
Tokens per H100 per day = 5000 * 60 * 60 * 24 = 432 million tokens per day
Total H100 GPUs needed  = 25 billion / 432 million = ~58 GPUs (just for output)
```

对于输入处理，我们通常需要更少的 GPU，因为输入 token 是并行处理的（我们将在连续批处理中看到这一点）。

因此大约需要 60 到 100 个 H100 GPU。

## 成本估算 {#cost-estimation}

```
H100 cost per hour = $3 (rented)
Daily cost  = 60 * 24 * 3 = $4320 per day
Monthly cost = ~$130,000 per month
```

这仅用于推断。存储、向量DB、可观测性等增加了更多成本。

这种估计就是我们在 AI 系统设计访谈中所做的。这里的数字只是例子，重要的是方法。
