# AI 系统设计 · 中英双语阅读站

在线阅读：<https://a-persimmons.github.io/ai-system-design/>

- 默认中文，右上角切换 English，保持对应章节。
- 55 组中英文页面，全文搜索、深色模式、移动端目录。
- 英文来自原始 README，中文章节位于 `translations/zh/`。
- 原作者为 Amit Shekhar / Outcome School，原作及本阅读版按 Apache-2.0 许可发布。
- 中文为独立维护的 AI 辅助译本，并非原作者官方译本。代码、ASCII 图和示例数据保留原文；学习路径提供中英步骤图及原 Mermaid 源码。

## 本地使用

需要 Node.js 22 或更新的兼容 LTS 版本。

```sh
npm ci
npm run docs:dev
```

构建、检查及预览：

```sh
npm run docs:build
npm run docs:check
npm run docs:preview
```

`site/` 下的章节和首页由 `scripts/prepare-site.mjs` 生成，请勿直接修改生成文件。

## 自动部署

推送到 `main` 后，GitHub Actions 自动安装依赖、构建、检查站内链接和双语页面，再部署到 GitHub Pages。Pull Request 只执行构建检查。工作流也支持手动运行。

Pages 的发布源应设为 **GitHub Actions**。工作流使用内置 `GITHUB_TOKEN`，无须额外 Secret。

## 维护中文翻译

只修改中文时，编辑 `translations/zh/<chapter-id>.md`，运行构建与检查后提交即可。保留标题中的显式 `{#anchor}`，以确保中英文链接一致。代码围栏、链接目标和表格列数应与原文对应。

## 同步英文新版本

`translations/manifest.json` 记录原文提交、SHA-256、章节行范围（从 0 开始、右端不包含）及标题锚点。构建会拒绝与翻译基线不一致的 README，防止中英文静默脱节。

1. 更新 README，检查上游新增或修改的段落。
2. 同步修改对应中文章节；有新增章节时，补齐文件与导航分组。
3. 更新 manifest 中的版本、摘要、章节范围和标题锚点。仅在翻译同步完成后更新摘要。
4. 运行 `npm run docs:build` 与 `npm run docs:check`，确认正文、代码块、表格及双语链接保持对应。

原始 README 不因站点构建而改写，便于继续同步上游。
