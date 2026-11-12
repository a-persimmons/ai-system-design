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
- **过渡短语可以争取时间。** 先说一句“好的，我来查一下”，就能让耗时 2 秒的工具调用显得更自然。

详细文章 [如何为语音 AI 智能体制定延迟预算？](https://outcomeschool.com/blog/voice-agent-latency-budget) 介绍如何选择目标，将预算分配到各个阶段，测量实际的 p50 和 p95 延迟，并优先缩短延迟最大的环节。

详细文章 [如何测量语音智能体的语音到语音延迟？](https://outcomeschool.com/blog/voice-to-voice-latency) 介绍如何通过双通道通话录音正确测量这一指标，并在多次通话中跟踪 p50 和 p95。

详细文章 [为什么首段音频延迟比总响应时间更重要？](https://outcomeschool.com/blog/time-to-first-audio) 解释用户为何主要感受到第一个声音出现前的静默，以及流式处理如何将后续响应的生成时间隐藏在用户收听过程中。

详细文章 [按句分块如何更快地将 LLM 输出送入 TTS？](https://outcomeschool.com/blog/sentence-chunking-for-tts) 解释智能体如何将流式 token 划分成句子，并在 LLM 继续生成时将每句话送入 TTS。

详细文章 [TTS 如何在完整句子到达前开始说话？](https://outcomeschool.com/blog/streaming-tts) 介绍只预读几个词的方法，以及能够同时读取文本并生成语音的新模型。这些方法让 TTS 提前开始输出，同时保持自然的语音效果。

详细文章 [推测性 LLM 生成如何在用户说完前开始准备回复？](https://outcomeschool.com/blog/speculative-generation-in-voice-agents) 解释智能体如何在确认用户轮次结束前就将其话语发送给 LLM，把生成的回复暂存在缓冲区中，仅当最终输入吻合时才播放，从而把 LLM 的计算时间隐藏在静默等待时间内。

详细文章 [过渡短语如何掩盖语音智能体的延迟？](https://outcomeschool.com/blog/filler-phrases-in-voice-agents) 介绍何时在工具调用期间说一句“我帮你查一下”、如何生成这类话语，以及如何将其保留在对话历史中。

详细文章 [语音智能体如何掩盖慢速工具调用的延迟？](https://outcomeschool.com/blog/slow-tool-calls-in-voice-agents) 解释如何立即给出简短回应，在较长等待期间报告进展，在工具后台运行时继续交谈，提前启动只读工具，以及处理超时。

其他特定于语音的问题：

- **语音活动检测（VAD）：** 判断用户何时停止说话，让模型开始思考。详细文章 [语音 AI 智能体的轮次交替](https://outcomeschool.com/blog/what-is-turn-taking-in-a-voice-ai-agent) 介绍轮次结束检测、语义轮次检测和附和反馈。[端点检测如何判断用户已经说完？](https://outcomeschool.com/blog/endpointing-in-voice-agents) 介绍静默计时器、基于词语和基于声音的轮次检测器，以及如何组合它们，在快速回复的同时避免打断用户。[基于静默与基于模型的轮次检测有何不同？](https://outcomeschool.com/blog/silence-vs-model-based-turn-detection) 解释固定静默超时为何会失效，以及轮次检测模型如何结合词语和声音判断用户是否说完。[动态端点检测如何适应用户语速？](https://outcomeschool.com/blog/dynamic-endpointing) 解释如何学习每位用户的正常停顿并据此调整等待时间，让快语速用户及时获得回答，也不打断慢语速用户。[语音智能体如何处理用户思考时的长停顿？](https://outcomeschool.com/blog/long-pauses-in-voice-agents) 介绍如何结合词语、语气和灵活的等待时间，留出思考空间，并在用户长时间沉默时温和询问。[语音智能体如何判断电话号码或邮箱还没说完？](https://outcomeschool.com/blog/unfinished-input-in-voice-agents) 介绍如何结合刚提出的问题、输入完整性检查和轮次检测模型，在用户分组读出号码或邮箱时继续倾听。[为什么语音智能体会在用户说到一半时打断？](https://outcomeschool.com/blog/voice-agents-cutting-users-off) 解释静默计时器为何把句中停顿误判为轮次结束、单纯延长等待为何会拖慢响应，以及语义轮次检测和打断处理如何解决问题。
- **打断处理（barge-in）：** 处理智能体还没说完、用户就开始讲话的情况。此时必须取消 LLM 和 TTS 流，让客户端丢弃已缓存但尚未播放的音频，并将历史记录中智能体的最后一轮回复截断到用户实际听见的词语。否则，下一轮的 LLM 会误以为用户已经听过尚未播放的内容。详细文章 [语音 AI 智能体中的打断](https://outcomeschool.com/blog/what-is-barge-in-in-a-voice-ai-agent) 介绍回声消除、误打断与真正打断的检测。[如何区分真实打断、咳嗽和背景噪声？](https://outcomeschool.com/blog/interruption-vs-background-noise) 解释如何结合降噪、语音活动检测、最短语音时长和词语检查，避免咳嗽或背景声打断智能体。[什么是附和反馈，为什么“嗯哼”不应让智能体停下？](https://outcomeschool.com/blog/backchannels-in-voice-agents) 解释“嗯哼”“好的”等短声为何表示“请继续”，以及如何根据时长、词语、语气和出现时机，在这些反馈中继续说话。[语音智能体如何在被打断时立即停止说话？](https://outcomeschool.com/blog/stopping-speech-on-interruption) 介绍如何清空设备到服务器各处等待播放的音频，取消 TTS 和 LLM，通过回复编号忽略迟到音频，并只保存用户真正听到的回复。[为什么 TTS 音频缓冲会拖慢打断响应？](https://outcomeschool.com/blog/tts-audio-buffering) 解释生成速度超过实时播放速度时音频为何积压，以及如何控制生成和发送节奏，使设备只保留少量音频，以便迅速停止。[语音智能体如何将记忆截断为用户实际听到的内容？](https://outcomeschool.com/blog/truncating-context-on-interruption) 介绍如何测量已播放时长，利用词级时间戳映射到词语，并据此裁剪保存的回复。[语音智能体如何从误打断中恢复？](https://outcomeschool.com/blog/false-interruption-recovery) 解释如何先暂停而非彻底停止，短暂等待以确认用户是否真的开口，再从暂停处继续回复。[语音智能体如何处理双方同时讲话？](https://outcomeschool.com/blog/overlapping-speech-in-voice-agents) 介绍如何边说边听，通过回声消除去掉自身声音，判断用户发声属于打断、附和还是噪声，再决定继续说话或停止并把发言机会交给用户。
- **说话人分离（Diarization）：** 在多人通话中确定每位说话人说了什么。
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
