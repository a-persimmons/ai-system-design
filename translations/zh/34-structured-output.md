# 结构化输出 {#structured-output}

很多时候，我们不想要 LLM 中的自由格式文本。我们想要一个可以直接在代码中使用的干净的 JSON 对象。

示例：我们正在构建一个简历解析器。我们希望 LLM 读取简历并返回：

```json
{
  "name": "Amit Shekhar",
  "email": "amit@example.com",
  "skills": ["Python", "Go", "Kotlin"],
  "experience_years": 10
}
```

如果我们只是要求 LLM“给我 JSON”，有时它会返回正确的 JSON，有时它会添加额外的文本，例如“当然，这是 JSON：”，有时它会返回损坏的 JSON。

为了解决这个问题，现代 API 支持 **结构化输出** （也称为 JSON 模式或约束解码）：

- 我们发送我们想要的模式。
- 推理服务器强制模型仅输出与架构匹配的有效 JSON。
- 我们得到一个保证可解析的响应。

示例：OpenAI 的 `response_format` 与 JSON Schema、Anthropic 的工具使用模式、vLLM 的引导解码、Outlines 库。

问题解决了。现在，我们管道的下一步可以信任 JSON，而无需编写脆弱的解析器。

当 LLM 输出进入管道的下一步时，结构化输出至关重要。没有它，我们就必须处理很多边缘情况。
