# 智能体技能（Agent Skills） {#agent-skills}

MCP 扩展了智能体能触达的系统，但仅有连接能力还不够。智能体还需要了解 **我们做事的方式** ：步骤、格式和检查清单。把这些全部塞进系统提示词，会迅速填满上下文窗口。

这时，[**智能体技能（Agent Skills）**](https://outcomeschool.com/blog/what-are-agent-skills) 就派上了用场。

**一个 Agent Skill 是一个包含指令的文件夹，也可以包含脚本和参考文件；AI 智能体仅在任务确实需要时自行加载它。**

Agent Skills 由 Anthropic 于 2025 年 10 月推出，采用开放格式。想象一位新员工加入团队：我们不会从零重新培训，而是交给他一本分章节的团队手册——报销、软件发布、撰写报告各有一章。他只在遇到对应工作时打开相关章节。一个 Skill 就相当于其中一章。

文件夹中必须有一个 `SKILL.md` 文件，包含 `name`、`description` 和具体指令。关键是 **渐进式披露** ，即分阶段提供信息，每次只提供当下需要的部分：

```
   Level 1  ->  name + description only          (always loaded, tiny)
   Level 2  ->  the full SKILL.md instructions   (loaded when it matches)
   Level 3  ->  extra files in the folder        (loaded only if needed)
```

第 1 层中，每个 Skill 只消耗约一百个 token；第 2 层通常控制在五千个 token 以内，而且只有实际使用某个 Skill 时才支付这部分开销。因此，50 个 Skill 的第 1 层信息，大约只相当于一个 Skill 的正文。智能体看起来深入掌握了 50 套流程，而上下文占用仍然很少。

下面用表格比较 Agent Skills 和 MCP，便于理解。

| 比较点 | Agent Skills | MCP |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- |
| 提供什么 | 专业知识、工作步骤与输出格式 | 连接外部系统的能力 |
| 它的组成 | 指令文件夹，有时还有脚本 | 提供工具和数据的运行程序 |
| 回答的问题 | 这件事应该怎么做？ | 智能体可以连接哪些系统？ |
| 是否需要运行服务器 | 否 | 是 |
| 最适合 | 操作流程、格式、风格、检查清单 | 数据库、应用、实时数据、实际操作 |

在实际工作中，我们会同时使用两者。 MCP 将智能体连接到我们的问题跟踪器，技能告诉它我们的团队如何编写问题。还有第三部分几乎完全像技能一样构建：[OKF（开放知识格式）](https://outcomeschool.com/blog/what-is-okf-open-knowledge-format)，它将有关我们数据的知识记录为纯 Markdown 文件的文件夹，因此任何智能体都知道我们的表的实际含义。
