# 长耗时 AI 任务的异步处理 {#async-processing-for-long-ai-tasks}

有些 AI 任务太长，无法进行流式传输。例如：

- 生成 100 页的报告
- 转录 2 小时的视频
- 运行智能体需要 10 分钟才能完成

对于这些，我们不进行直播。我们进行异步处理。

该流程分两个阶段进行：

```
Stage 1: Client kicks off the job and gets a job_id back

   Client  ---request--->   Backend   ---enqueue--->  Queue
   Client  <--job_id, "processing"--   Backend


Stage 2: Worker runs the task in the background

   Queue   ---pull--->   Worker   ---run task--->   Database
                                  (saves result)


Stage 3: Client polls for the result (or gets a webhook)

   Client  ---poll job_id--->   Backend   ---read--->   Database
   Client  <---result/status---  Backend
```

一步一步：

**步骤1：** 客户端发送请求。

**步骤2：** 后端立即响应`{ "job_id": "12345", "status": "processing" }`。

**Step 3:** 后端将作业放入消息队列中。

**Step 4:** 后台工作人员拿起作业并运行它。

**步骤 5：** 完成后，工作人员将结果存储在数据库中。

**步骤 6：** 客户端使用作业 ID 轮询状态，或获取 Webhook 回调。

这与常规异步处理的模式相同，但任务是 AI 任务（LLM 调用、嵌入向量、转录等）。
