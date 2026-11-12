# 工具调用 {#tool-calling}

工具调用是 LLM 告诉我们“请帮我调用这个函数”的方式。

LLM 获取可用工具列表作为其提示词的一部分。每个工具都有一个 **name** 、一个 **description** 和一个 **输入模式** 。

下面是工具定义在实践中的样子：

```json
{
  "name": "web_search",
  "description": "Search the web for pages matching the query. Use this tool when the user asks for current information, news, or anything not available in the model's training data.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query to run."
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum number of results to return. Default is 5."
      }
    },
    "required": ["query"]
  }
}
```

这里，LLM 读取 `name` 来识别工具，读取 `description` 来决定 **何时** 推荐使用它，读取 `input_schema` 来了解 **应传入哪些参数** 及其格式。`description` 是最重要的字段，每个词都很重要，因为 LLM 正是凭它在工具之间作出选择。模糊的描述会导致选错工具，准确的描述则有助于选对。

当 LLM 决定推荐某个工具时，它会返回包含工具名称和参数的结构化输出。我们的代码解析该输出，执行实际搜索，再把结果作为下一条消息反馈给模型。这样就能顺利工作。

这称为 [**函数调用（function calling）**](https://outcomeschool.com/blog/how-does-function-calling-work-in-llms)，也叫 **工具调用（tool calling）** 。两者含义相同，是所有智能体 AI 的基础。

**注意：** LLM 从不亲自运行工具，只返回工具名称和参数。实际运行工具的是我们的代码。这是一条重要的安全边界：代码可以在操作发生前验证每个参数，并拒绝任何不合适的操作。

在智能体系统中，良好的工具设计比模型选择更重要。糟糕的工具——名称模糊、参数不清楚、输出噪声大——会让最聪明的模型也表现不佳。
