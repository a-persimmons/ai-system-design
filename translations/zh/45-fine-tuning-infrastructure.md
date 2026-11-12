# 微调基础设施 {#fine-tuning-infrastructure}

有时，提示和 RAG 还不够。我们需要教授模型新的行为。

为此，我们使用 [**微调**](https://outcomeschool.com/blog/how-does-fine-tuning-work) 模型。我们采用一个基本模型（如 Llama 8B）并根据我们自己的数据对其进行进一步训练。

一个简单的决定方法： **RAG 为模型提供了新的知识。 微调赋予模型新的行为** （一种格式、一种语气、一种狭窄的技能）。如果问题是“模型不知道我们的数据”，请使用 RAG。如果问题是“即使使用良好的提示词，模型也不会按照我们想要的方式运行”，请考虑微调。

微调需要单独的基础设施：

## 训练集群 {#training-cluster}

一群 GPU 机器通过快速网络连接。 Tensor 和流水线并行用于跨多个 GPU 训练大型模型。

## 训练数据管道 {#training-data-pipeline}

我们收集训练数据，清理数据，删除重复数据，并将其转换为正确的格式。这本身就是一项艰巨的工作。不良数据会产生不良的微调模型。

## 实验跟踪 {#experiment-tracking}

我们尝试使用不同的超参数运行许多微调。我们使用权重和偏差或 MLflow 等工具跟踪每次运行。

## 模型注册表 {#model-registry}

训练后，我们保存模型的版本。 推理服务器可以拉出正确的版本。

## 评价 {#evaluation}

在部署微调后的模型之前，我们通过评估管道运行它，以确保它确实变得更好。

使用的工具：Hugging Face TRL、Axolotl、LLaMA Factory、Unsloth。

对于大多数应用程序，我们不需要微调。提示加RAG就够了。我个人认为，大多数团队过早地寻求微调，因为更好的提示、更好的检索或更强的基础模型本来可以事半功倍地解决问题。只有当我们的任务非常狭窄并且有大量高质量的训练数据时，微调才值得。

流行的中间立场是 **[LoRA（低阶适应）](https://outcomeschool.com/blog/lora-low-rank-adaptation-of-llms)** 。 LoRA 不是使用微调模型的所有权重（这很昂贵），而是冻结原始权重并仅在顶部训练一小部分额外的“适配器”权重。适配器很小 - 有时不到模型总尺寸的 1%。这使得微调更便宜、更快，而且我们可以为不同的任务保留多个 LoRA 适配器，并在推理时交换它们。目前大多数微调生产都使用 LoRA 或 QLoRA 等变体。

要亲自学习微调、PEFT、LoRA、QLoRA、量化、知识蒸馏和 SLM，请查看 Outcome School 的 [AI 和机器学习程序](https://outcomeschool.com/program/ai-and-machine-learning)。
