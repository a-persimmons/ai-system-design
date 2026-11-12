# 多模态系统 {#multimodal-systems}

到目前为止，我们已经讨论了纯文本模型。但现代AI 系统也可以处理图像、音频和视频。这些系统称为 [**多模态**](https://outcomeschool.com/blog/multimodal-ai) 系统。简而言之，多模态模型可以理解，有时甚至可以生成不止一种数据。在模型内部，每种数据都在共享空间中转换为嵌入向量，从而使猫的图像和“猫”一词紧密结合在一起。

示例：

- ChatGPT 可以查看图像并描述它。
- Whisper 可以获取音频并将其转录。
- Veo 和 Sora 可以获取文本并生成视频。
- GPT-5.5可以截取网页截图并为其编写代码。

在多模态系统中，系统设计有一些额外的问题。

## 存储 {#storage}

图像、音频和视频都很大。我们不会将它们存储在我们的常规数据库中。我们将它们存储在 **对象存储** （AWS S3、Cloudflare R2）中，并仅将 URL 或 ID 保留在数据库中。

## 预处理流水线 {#pre-processing-pipeline}

在发送媒体到LLM之前，我们通常：

- 调整图像大小（LLM 只需要一定的分辨率）
- 转换格式（音频将 mp3 转换为 wav，视频将 mp4 转换为帧）
- 压缩以降低 token 成本（某些图像模型按像素收费）

## token 成本 {#token-cost}

图像、音频和视频消耗的 token 远多于文本。一张高分辨率图像可能需要 1,500 到 3,000 个 token，一分钟音频可能需要 1,000 个 token。成本跟踪必须考虑这些因素。我们有一篇详细文章：[视觉语言模型（VLM）如何工作？](https://outcomeschool.com/blog/vision-language-model-vlm)，解释图像如何被转换为 LLM 可以读取的 token。

## 输出模态 {#output-modalities}

有些模型只输出文本，但接受图像输入；另一些模型可以输出图像、音频或视频。架构需要为每个模型处理正确的输入与输出通道。

## 延迟 {#latency}

生成图像或视频比生成文本慢得多，一段视频可能需要数分钟。因此，多模态系统广泛采用异步处理和流式传输。

## 语音与实时 API {#voice-and-realtime-apis}

接下来讨论语音 AI。这是一个特殊且越来越重要的多模态场景。语音 AI 应用，如 ChatGPT Voice、电话客服机器人或会议助手，需要实时完成三件事：

- **STT（Speech-to-Text，语音转文本）：** 将用户语音转换为文本。
- **LLM：** 对文本进行推理并生成响应。
- **TTS（Text-to-Speech，文本转语音）：** 将响应转换为音频。

最简单的实现会先等 STT 完成，再等 LLM 完成，最后等 TTS 完成。用户几秒钟内什么都听不到，体验就像系统出了故障。

在生产环境中，我们采用 **双向流式传输** ：用户说话时，STT 持续输出文本；LLM 根据部分输入就开始思考；一旦最初几个词准备好，TTS 就开始流式输出音频。

```
                  bidirectional streaming
   User speaks --> STT --> partial text --> LLM --> partial text
                                                       |
                                                       v
   User hears <-- TTS <-- partial audio <----------- response
```

传输通常采用 **[WebRTC](https://outcomeschool.com/blog/voice-and-video-call)** （浏览器原生、面向实时音视频的协议）、 **WebSocket** （持久双向连接）或 **SIP** （电话网络建立语音通话的标准协议）。普通 HTTP 无法满足这种需求。

我们有一篇详细文章：[实时语音流水线中的音频帧与块大小是什么？](https://outcomeschool.com/blog/audio-frames-and-chunk-sizes)，解释音频如何被切分为小帧、怎样计算帧大小，以及块大小如何在延迟和开销之间取得平衡。

现代服务商提供将三者整合的 **实时 API** ，例如 OpenAI Realtime API、Amazon Polly Bidirectional Streaming、Deepgram Voice Agent、Inworld、Soniox 和 x.ai Voice。它们将 STT、LLM 和 TTS 合并为一条低延迟流水线。

语音 AI 对延迟的要求很严格。端到端语音响应延迟低于 800 ms 时，对话较为自然；超过 1.5 秒则像系统出了问题。这比文本聊天严格得多。

语音智能体最重要的指标是 **语音到语音延迟（Voice-to-Voice Latency）** ，即从用户停止说话，到用户听见智能体回复的第一个声音之间的时间。以 800 ms 为目标的级联流水线为例，看看每一毫秒花在了哪里：

| 阶段 | 目标 | 说明 |
| ----------------------------------- | ------------------- | ------------------------------------------------------ |
| 网络：用户到服务器（音频输入） | 30 至 80 毫秒 | 取决于距离。部署在靠近用户的区域。 |
| 轮次检测等待 | 150 至 300 ms | 结合语义模型的动态静音阈值 |
| STT 最终转写 | 50 至 150 ms | 流式 STT 已准备好大部分词语 |
| LLM 首 token 延迟 | 150 至 300 ms | 小型快速模型，提示词缓存，短上下文。 |
| LLM 完成第一句话 | 100 至 200 ms | 流式输出 token，并缩短第一句话 |
| TTS 首个音频字节延迟 | 80 至 200 ms | 采用流式 TTS |
| 网络：服务器到用户（音频输出） | 30 至 80 ms | 在客户端上加上抖动缓冲区。 |
| **合计** | **600 至 1,300 ms** | 目标 p50 时为 800 ms，p95 时为 1.2 s 以下。 |

在这里，我们可以注意到没有一个阶段是我们可以忽略的。需要记住的一些规则：

- **全流程流式处理.** 永远不要等待完整的文字记录、完整的 LLM 回复或完整的 TTS 输出。
- **重叠阶段。** 当 TTS 说出句子一时，LLM 写句子二。
- **就近部署.** 将协调器、STT、LLM 和 TTS 保持在同一数据中心。它们之间的每个网络跃点都会增加 10 到 50 毫秒。
- **热连接。** 保持与通话开始前已打开的 STT 和 TTS 连接。
- **预生成问候语。** 第一行始终相同，因此我们缓存其音频并立即播放。
- **Fillers 赢得了时间。** 快速的“当然，让我检查一下”让 2 秒的工具调用感觉很好。

我们有一篇关于 [如何为语音 AI 智能体建立延迟预算？](https://outcomeschool.com/blog/voice-agent-latency-budget) 的详细博客，其中解释了如何选择目标，将其划分到每个阶段，测量 p50 和 p95 的实际数字，并首先减少最大延迟。

我们有一篇关于 [的详细博客如何测量语音智能体的语音到语音延迟？](https://outcomeschool.com/blog/voice-to-voice-latency) 解释了如何通过两通道通话录音正确测量该数字，并在多次通话中以 p50 和 p95 跟踪它。

我们在 [上有一篇详细的博客，为什么首次发出音频的时间比总响应时间更重要？](https://outcomeschool.com/blog/time-to-first-audio) 解释了为什么用户只感觉到第一个声音之前的沉默，以及流媒体如何隐藏收听时间内的其余回复。

我们有一篇关于 [的详细博客，句子分块如何更快地将 LLM 输出馈送到 TTS？](https://outcomeschool.com/blog/sentence-chunking-for-tts)，其中解释了智能体如何将流式传输的 token 分割成句子，并在 LLM 仍在写作时将每个句子发送到 TTS。

我们在 [上有一篇详细的博客，TTS 模型如何在完整句子到达之前开始说话？](https://outcomeschool.com/blog/streaming-tts) 解释了如何对几个单词进行少量前瞻，以及同时读取文本和说话的较新模型如何让 TTS 尽早开始说话，同时听起来仍然很自然。

我们有一篇关于 [的详细博客，推测性 LLM 生成如何在用户完成之前开始回复？](https://outcomeschool.com/blog/speculative-generation-in-voice-agents) 解释了智能体如何在回合结束确认之前将用户的单词发送到 LLM，将回复隐藏在缓冲区中，并且仅在最终单词匹配时才播放，因此LLM 时间隐藏在寂静的等待中。

我们有一篇关于 [填充短语如何隐藏语音智能体中的延迟的详细博客？](https://outcomeschool.com/blog/filler-phrases-in-voice-agents) 解释了智能体在工具调用运行时何时会说“让我为您检查一下”之类的短行、生成它的方法以及如何将其保留在对话历史记录中。

我们有一篇关于 [的详细博客，语音智能体如何隐藏慢速工具调用的延迟？](https://outcomeschool.com/blog/slow-tool-calls-in-voice-agents) 解释了智能体如何立即说出简短的台词，在长时间等待期间提供进度更新，在工具在后台运行时保持通话，提前启动只读工具以及处理超时。

其他特定于语音的问题：

- **语音活动检测 (VAD)：** 了解用户何时停止说话，以便模型可以开始思考。我们有一篇关于语音 AI 智能体](https://outcomeschool.com/blog/what-is-turn-taking-in-a-voice-ai-agent) 中的 [转弯的详细博客，其中解释了转弯结束检测、语义转弯检测和反向通道。我们有一篇关于 [的详细博客，端点如何决定用户何时结束讲话？](https://outcomeschool.com/blog/endpointing-in-voice-agents) 解释了静音计时器、基于单词和基于语音的转弯检测器，以及智能体如何将它们结合起来快速回复而不打断用户。我们有一篇关于 [基于静音和基于模型的转弯检测有何不同？](https://outcomeschool.com/blog/silence-vs-model-based-turn-detection) 的详细博客，解释了固定静音超时失败的原因，以及转弯检测模型如何读取单词和声音来决定用户何时完成。我们有一篇关于 [动态端点如何适应用户说话速度的详细博客？](https://outcomeschool.com/blog/dynamic-endpointing) 解释了智能体如何学习每个用户的正常停顿并将其转化为等待时间，以便快速说话的人得到快速回复，而慢速说话的人不会被打断。我们有一篇关于 [的详细博客，语音智能体如何处理用户思考时的长时间停顿？](https://outcomeschool.com/blog/long-pauses-in-voice-agents) 解释了智能体如何使用单词、语气和灵活的等待时间来等待思考停顿，以及当用户长时间保持沉默时它如何轻轻地检查。我们有一篇关于 [的详细博客，语音智能体如何知道电话号码或电子邮件尚未完成？](https://outcomeschool.com/blog/unfinished-input-in-voice-agents) 解释了智能体如何使用它刚刚提出的问题、检查值是否看起来完整，以及在用户以小组形式读出电话号码或电子邮件时继续监听的轮流检测模型。我们有一篇关于 [为什么语音智能体会在句子中打断人们的话？](https://outcomeschool.com/blog/voice-agents-cutting-users-off) 的博客，解释了为什么静音计时器将句子中的暂停错误地视为回合结束，为什么简单地等待更长的时间会使智能体变慢，以及语义回合检测和打断处理如何修复它。
- **中断处理 (打断):** 当用户在智能体完成之前开始讲话时会发生什么情况。我们必须取消 LLM 和 TTS 流，告诉客户端删除已缓冲但尚未播放的音频，并将智能体历史记录中的最后一个回合剪切为仅用户实际听到的单词。否则，在下一个回合中，LLM 会认为用户听到了他们从未听过的东西。我们有一篇关于语音 AI 智能体](https://outcomeschool.com/blog/what-is-barge-in-in-a-voice-ai-agent) 中的 [插入的详细博客，其中解释了回声消除、错误插入以及智能体如何检测真正的中断。我们有一篇关于 [的详细博客，语音智能体如何辨别咳嗽或背景噪音的真正干扰？](https://outcomeschool.com/blog/interruption-vs-background-noise)，解释了噪音抑制、语音活动检测、最短语音时间和单词检查如何阻止咳嗽和背景声音切断智能体。我们有一篇关于 [的详细博客什么是反向通道，为什么“mm-hmm”不应该阻止智能体？](https://outcomeschool.com/blog/backchannels-in-voice-agents) 解释了为什么像“mm-hmm”和“好的”这样的短音意味着“继续”，以及智能体如何使用长度、单词、语气和声音的时间来继续通过它们说话。我们有一篇关于 [的详细博客，语音智能体如何在被打断时立即停止说话？](https://outcomeschool.com/blog/stopping-speech-on-interruption) 解释了智能体如何清除其音频等待的每个位置，从设备到服务器，取消 TTS 和 LLM，忽略带有回复编号的迟到音频，并仅保存用户实际回复的部分听到了。我们有一篇关于 [为什么 TTS 音频缓冲会使中断变慢？](https://outcomeschool.com/blog/tts-audio-buffering) 的详细博客，解释了为什么比实时创建得更快的音频会堆积在缓冲区中，以及节奏如何在设备上仅保留少量音频，以便智能体可以快速停止。我们有一篇关于 [的详细博客，语音智能体如何将其内存截断为仅用户实际听到的内容？](https://outcomeschool.com/blog/truncating-context-on-interruption) 解释了智能体如何测量播放了多少音频，将时间转换为带有单词时间戳的单词，并剪切其保存的回复以匹配。我们有一篇关于 [语音智能体如何从错误中断中恢复？](https://outcomeschool.com/blog/false-interruption-recovery) 的详细博客，解释了智能体如何暂停而不是停止，等待一小段时间以检查用户是否真的说话，然后从暂停的地方继续回复。我们有一篇关于 [的详细博客，语音智能体如何处理用户和智能体同时说话？](https://outcomeschool.com/blog/overlapping-speech-in-voice-agents) 解释了智能体如何在说话时保持监听，通过回声消除消除自己的声音，决定用户的声音是中断、反向通道还是噪音，然后继续说话或停止，将轮到用户。
- **Diarization：** 了解多人通话中哪个发言者说了些什么。
- **噪声和口音稳健性：** STT 质量在嘈杂环境和非标准口音中快速下降。

构建语音智能体有两种主要方法： **级联管道** （STT -> LLM -> TTS）和单个 **语音到语音** 模型，该模型接收音频并输出音频。让我将主要差异制成表格，以便您更好地理解。

| 方面 | 级联管道（STT -> LLM -> TTS） | 语音到语音模型 |
| ------------------------------ | ------------------------------------- | ------------------------------------- |
| 语音到语音延迟 | 700 ms 至 1.2 s（深度优化） | 300 ms 至 600 ms |
| 情绪与语气理解 | 转换为文本时会丢失 | 可以保留 |
| 对说话内容的控制 | 完全控制，可以先检查文本 | 有限 |
| 防护与敏感信息脱敏 | 容易 | 困难 |
| 工具调用 | 成熟可靠 | 支持，但成熟度较低 |
| 调试与评估 | 容易，每个阶段都有转写文本 | 困难，输入输出都是音频 |
| 每分钟成本 | 较低 | 较高 |
| 最适合 | 客服、银行、医疗 | 陪伴、辅导、日常助手 |

需要可控性、合规性、工具调用和低成本时，采用 **级联流水线** 。这是大多数商业场景的默认选择。当自然的对话体验本身就是产品核心时，则采用 **语音到语音** 架构。

我们有一篇详细文章：[级联与语音到语音：如何选择合适的语音智能体架构？](https://outcomeschool.com/blog/cascaded-vs-speech-to-speech)，还介绍了介于两者之间的半级联路线，以及如何根据场景作出选择。

我们有一篇详细文章：[半双工与全双工语音智能体有什么区别？](https://outcomeschool.com/blog/half-duplex-vs-full-duplex-voice-agents)，解释全双工模型如何同时听和说，并与采用打断机制、轮流交互的智能体进行比较。

关于完整的端到端设计，包括容量估算、架构、轮次检测、电话接入、扩展和边界情况，可阅读我们的详细文章：[如何设计实时语音 AI 智能体](https://outcomeschool.com/blog/design-a-real-time-voice-ai-agent)。

2026 年，从电话机器人到实时会议助手，越来越多产品开始采用语音 AI，因此上述设计模式值得了解。

## 边缘 AI 与端侧推理 {#edge-ai-and-on-device-inference}

现在换一个角度。到目前为止，我们都假设模型运行在云端。但越来越多应用会直接在手机、笔记本电脑、手表或汽车等设备上运行小模型。这就是 **边缘 AI（Edge AI）** 。

例如：Apple Intelligence 的许多功能使用端侧小型基础模型；Gemini Nano 运行在 Pixel 手机上；Llama 3.2 的 1B 和 3B 模型专为边缘场景设计。

为什么要在设备端运行：

- **隐私：** 数据不会离开设备。
- **延迟：** 无须与服务器往返通信。
- **成本：** 没有云端 GPU 账单。
- **离线：** 无网络也能工作。

但也有这些限制：

- 边缘设备的内存和算力很有限。因此会使用参数量为 1B 到 8B 的 [小语言模型（SLM）](https://outcomeschool.com/blog/small-language-models-slms)，通过强力 [量化](https://outcomeschool.com/blog/how-does-model-quantization-work) 压缩到 4 位甚至 2 位，并且常用大模型的 [知识蒸馏](https://outcomeschool.com/blog/how-does-knowledge-distillation-work) 来训练。
- 电池续航是实际存在的约束。
- 更新必须随应用更新推送，不能像服务器模型那样直接发布。

一种常见模式是 **混合 AI** ：端侧小模型处理简单请求和涉及隐私的请求，困难或不涉及隐私的请求则回退到云端模型。Apple Intelligence 正是这样设计的。

```
        [ User's question ]
                |
                v
     [ Small model on the device ]
                |
        Can I handle this?
                |
        +-------+-------+
        |               |
       Yes              No
        |               |
        v               v
   [ Answer on     [ Send to the big
     the device ]    cloud model ]
```

可以看到，大部分问题都直接在设备上得到回答，速度快且保护隐私；只有难题才发送到云端。语音助手就是如此：“设置十分钟计时器”无须联网，而“写一首关于季风的诗”则交给云端。网络断开后，设备仍能处理简单任务，而不是完全失效。我们有一篇详细文章：[云端与端侧模型部署](https://outcomeschool.com/blog/cloud-vs-on-device-model-deployment)，深入比较这两种方式。

设计 AI 系统时，要问自己：哪些工作负载可以在设备端运行？
