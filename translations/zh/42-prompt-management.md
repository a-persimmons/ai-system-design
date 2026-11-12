# 提示词管理 {#prompt-management}

在 AI 中，提示词决定行为。 提示词中的单个单词更改可能会改变模型生成的答案。因此，我们必须像对待代码一样对待提示词：

- 在 git 中对它们进行版本控制
- 用 evals 测试它们
- 逐步推出新的提示词
- 如果质量下降则回滚

提示词管理系统存储：

- 提示词模板
- 版本
- 此版本传递的评估
- 哪些模型适用于该版本

工具：PromptLayer、Humanloop、LangSmith 提示词、Latitude。

我们从不在生产中的应用程序代码中硬编码提示词。我们从提示词管理系统中提取它们，就像我们从配置服务中提取配置一样。

一些提示词技术在生产中反复出现。 [**思想链（CoT）提示**](https://outcomeschool.com/blog/how-does-chain-of-thought-prompting-work)要求模型在给出最终答案之前写出其推理步骤，这提高了多步骤问题的准确性，但会花费更多的输出 token。 [**思想树**](https://outcomeschool.com/blog/how-does-tree-of-thoughts-work) 更进一步：模型探索许多推理路径，判断每一步，并从不好的步骤中回溯，这有助于解决类似搜索的问题，但会花费更多的 LLM 调用。 [**提示词链接**](https://outcomeschool.com/blog/how-does-prompt-chaining-work) 将一项大任务分解为更小的提示词，其中一个提示词的输出成为下一个提示词的输入，因此每个步骤都很小、可测试且可靠。

## 使用 DSPy 进行编程提示 {#programmatic-prompting-with-dspy}

现在，让我们看看提示词的另一种编写方式。一种新方法开始取代手写的提示词： **DSPy** ，这是斯坦福大学的一个用于编程语言模型的框架，而不是提示它们。

DSPy 背后的想法很简单：我们不是将提示词写为字符串，而是使用类型化的 **签名** （输入字段和输出字段）来描述我们想要的内容，DSPy 会自动将其编译为实际的提示词。我们还可以让 DSPy 运行一个优化器，在我们的评估集上尝试许多提示词变体，并选择得分最高的一个。

**DSPy 让我们可以像编译代码一样编译提示词。**

一个小的 DSPy 示例，只是为了了解一下想法：

```python
import dspy

class AnswerQuestion(dspy.Signature):
    """Answer the user's question based on the context."""
    context: str = dspy.InputField()
    question: str = dspy.InputField()
    answer: str = dspy.OutputField()

qa = dspy.ChainOfThought(AnswerQuestion)
result = qa(context="...", question="What is the refund policy?")
print(result.answer)
```

任何地方都没有手写的提示词。 DSPy 根据签名生成一个签名，我们可以交换底层模型或运行编译器来提高质量，而无需更改代码。

DSPy 并不是提示词管理的替代品 - 它是编写提示词本身的替代方法。它对于复杂的管道（多步 RAG、智能体）特别有用，因为手动调整每个提示词会变得很痛苦。
