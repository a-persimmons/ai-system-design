# AI 智能体的记忆 {#memory-for-ai-agents}

LLM 本身是 **无状态** 的。每次调用它，都像在和一个从未见过我们的人交谈。 **[AI 智能体记忆](https://outcomeschool.com/blog/ai-agent-memory)** 是我们围绕 LLM 构建的一整套机制，让它看起来能够记住事情。LLM 本身并没有真正记住，而是由智能体代为记忆。

简单来说， **[记忆系统](https://outcomeschool.com/blog/ai-agent-memory) 让无状态的 LLM 表现得像是能跨轮次、跨会话记住不同用户的信息。**

## 记忆层次 {#the-memory-stack}

AI 智能体的记忆不是单一组件，而是由多个层次组成，每层都有不同的生命周期和用途。

```
+--------------------------------------------+
|              AI Agent Memory               |
|                                            |
|  Layer 1: Context Window (in the prompt)   |
|     - In the current prompt                |
|     - Lost when context overflows          |
|                                            |
|  Layer 2: Short-Term Memory (session)      |
|     - Scratchpad, current task state       |
|     - Lost when the session ends           |
|                                            |
|  Layer 3: Long-Term Memory (persistent)    |
|     - Facts about the user                 |
|     - Past conversations                   |
|     - Learned preferences                  |
|                                            |
|  Layer 4: External Knowledge (tools/RAG)   |
|     - Documents, databases, APIs           |
|     - Queried, not maintained by agent     |
+--------------------------------------------+
```

**第 1 层：上下文窗口。** 这是 LLM 在单次调用中看到的文本。因为模型直接读取它，所以它是最快的记忆形式，但容量也最有限。一旦填满，就必须删除或总结较早的消息。

**第 2 层：短期记忆。** 这是智能体在一次任务或会话中使用的工作记录，保存计划、当前步骤和中间结果。会话结束后，这些记忆通常就会消失。

**第 3 层：长期记忆。** 这是跨对话、跨会话保留的持久记忆，记录用户信息、偏好、历史对话摘要和学到的行为，让智能体看起来“了解”用户。长期记忆又可分为 **情景记忆** （过去的经历）、 **语义记忆** （事实和概念）和 **程序性记忆** （做事的方法）。

**第 4 层：外部知识。** 包括智能体可以查询但不负责维护的文档、数据库、API 和网页。智能体从这些来源读取内容，但不会把自己的记忆写回这些来源。

所有四层一起工作。上下文窗口是LLM 的桌子。短期记忆是桌子旁边的记事本。长期记忆是抽屉里的个人日记。外部知识就是街对面的图书馆。我们希望保持办公桌清洁、记事本井井有条、日记值得信赖、图书馆有索引。

## 四项核心操作 {#the-four-core-operations}

无论我们有多少层，每个记忆系统都只做四件事：

**1. 写入。** 保存新信息。例如用户说“我更喜欢用 Go 写代码”后，将“偏好语言：Go”写入长期记忆。

**2. 读取。** 需要时取回相关信息。这通常最难：我们需要的不是全部信息，而是当下重要的信息。

**3. 更新。** 当新信息与已有记忆冲突时，修改记忆。例如用户上个月偏好 Python，现在改为 Go，就必须更新对应记录。

**4. 遗忘。** 删除过时、错误或不再相关的记忆。如果没有遗忘机制，记忆存储会无限增长，检索效果也会变差。

**记忆系统 = 写入 + 读取 + 更新 + 遗忘。**

如果其中任何一个被破坏，整个记忆系统就会崩溃。

## 运行时的记忆流转 {#how-memory-flows-at-runtime}

```
                   User Message
                        |
                        v
          +----------------------------+
          |        READ Memory         |
          |  - Long-Term (user facts,  |
          |    preferences, summaries) |
          |  - Short-Term (plan,       |
          |    recent steps)           |
          +-------------+--------------+
                        |
                        v
          +----------------------------+
          |       Build Prompt         |
          |  (system prompt +          |
          |   retrieved memories +     |
          |   user message)            |
          +-------------+--------------+
                        |
                        v
          +----------------------------+    +---------------------+
          |            LLM             |<-->| External Knowledge  |
          |    (reasons, replies)      |    | (tools, RAG, APIs)  |
          +-------------+--------------+    +---------------------+
                        |
                        v
          +----------------------------+
          |        WRITE Memory        |
          |  - Short-Term (new step)   |
          |  - Long-Term (if worth     |
          |    keeping)                |
          +-------------+--------------+
                        |
                        v
                     Response
```

用文字描述同一流程：每一轮中，智能体检索相关记忆、构建提示词、调用 LLM（模型可能推荐工具，由执行循环运行）、写入新记忆并回复。 **每一轮都是：读取 → 构建提示词 → 回复 → 写入。**

学习这一点的最好方法是举个例子。

**用户回合 1：** “我的名字是 Priya，我用 Go 编写代码。”

- 长期记忆是空的。没有什么可检索的。
- LLM 回复：“很高兴见到你，Priya。”
- 智能体写入长期记忆：“用户叫 Priya，偏好语言为 Go。”

**用户第 2 轮（一周后）：** “帮我写一个反转字符串的函数。”

- 智能体搜索长期记忆。它检索到：“Priya，更喜欢 Go。”
- 提示词变为： 系统提示词 + “用户是 Priya，更喜欢 Go” + “帮我写一个反转字符串的函数。”
- LLM 在回复中称呼 Priya，并给出一个 Go 函数。

虽然隔了一周，第二轮对话仍然显得个性化。LLM 本身没有记住任何信息，全部记忆工作都由智能体完成。

这正是 ChatGPT 在不同聊天中仍让人感到个性化的原因。详细解释见：[ChatGPT 如何记住你？](https://outcomeschool.com/blog/how-does-chatgpt-remember-you)。

## 储存什么和不储存什么 {#what-to-store-and-what-not-to-store}

最大的错误之一是存储太多。

**存储此：**

- 稳定的用户信息（名称、角色、语言、时区）。
- 强烈的偏好（喜欢简短的答案，想要用 Python 编写代码）。
- 过去任务的结果（哪些有效，哪些失败）。
- 影响未来工作的决策（架构选择、政策、约束）。

**请勿存储此：**

- 每一条消息。上下文窗口已经有实时对话。
- 低信号闲聊（“嗨”、“谢谢”、“好的”）。
- 已经存在于短期记忆中的临时状态。
- 未获用户同意保存的敏感数据。

简单来说：

**保存下周仍有价值的信息，跳过只对下一分钟有意义的内容。**

Mem0、Letta（以前称为 MemGPT）和 Zep 等工具专门用于管理智能体记忆。
