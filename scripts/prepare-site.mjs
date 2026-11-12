import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { manifest, chapters, groups, repo } from './site-data.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = await fs.readFile(path.join(root, 'README.md'), 'utf8');
if (createHash('sha256').update(source).digest('hex') !== manifest.sourceSha256) {
  throw new Error('README.md differs from the translated source. Update the bilingual chapters and translations/manifest.json together; see SITE.md.');
}
const lines = source.split(/\r?\n/);
const headingMap = new Map(manifest.headings.map(h => [h.line, h]));
const anchorMap = new Map();
for (const h of manifest.headings) {
  const c = chapters.find(c => h.line >= c.start && h.line < c.end);
  if (c) anchorMap.set(h.anchor, c.id);
}
const title = (c,en) => en ? c.title : c.zhTitle;
const write = async (name, body) => {
  const target = path.join(root,'site',name);
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,body);
};
function adapt(body, en) {
  let fenced = false;
  return body.split('\n').map(line => {
    if (line.startsWith('```')) { fenced = !fenced; return line; }
    if (fenced) return line;
    line = line.replace(/https:\/\/github\.com\/amitshekhariitbhu\/ai-system-design\/blob\/main\/assets\/banner\.png/g,'/assets/banner.png');
    line = line.replace(/\]\(#([^)]+)\)/g, (_,anchor) => {
      if (anchor === 'table-of-contents') return `](${en ? '/en' : ''}/contents)`;
      if (!anchorMap.has(anchor)) throw new Error(`Unknown original anchor: ${anchor}`);
      return `](${en ? '/en' : ''}/guide/${anchorMap.get(anchor)}#${anchor})`;
    });
    return line.replace(/\*\*(.+?)\*\*/g, (_,s) => ` **${s.trim()}** `).trimEnd();
  }).join('\n');
}
const roadmapZh = ['基础：token、推理服务器与硬件','LLM 推理：预填充与解码','扩展、容量估算与负载均衡','缓存与 LLM 路由','嵌入向量、向量数据库与 RAG','上下文窗口管理','流式传输、队列、限流与 AI 网关','AI 智能体、工具、MCP 与记忆','多智能体系统','多模态与语音 AI','防护、安全与隐私','可观测性与评估','成本、微调与推理优化','解决 AI 系统设计问题'];
function roadmap(body,en) {
  return body.replace(/```mermaid\n([\s\S]*?)```/g, (_,code) => {
    const labels = [...code.matchAll(/[A-N]\[([^\]]+)\]/g)].map(m=>m[1]);
    const unique = [...new Set(labels)];
    if (unique.length !== 14) throw new Error('Learning path source changed. Review its bilingual visual.');
    const items = (en ? unique : roadmapZh).map(s=>`<li>${s}</li>`).join('\n');
    return `<ol class="learning-path" aria-label="${en ? 'Learning path' : '学习路径'}">\n${items}\n</ol>\n\n<details>\n<summary>${en ? 'Original Mermaid source' : '查看原始 Mermaid 图源码'}</summary>\n\n\`\`\`text\n${code}\`\`\`\n\n</details>`;
  });
}
for (const en of [false,true]) {
  const prefix = en ? 'en/' : '';
  for (const [index,c] of chapters.entries()) {
    let body;
    if (en) {
      body = lines.slice(c.start,c.end).map((line,offset) => {
        const h = headingMap.get(c.start+offset);
        if (!h) return line;
        return '#'.repeat(index===0 ? h.level : Math.max(1,h.level-1))+` ${h.title} {#${h.anchor}}`;
      }).join('\n');
    } else body = await fs.readFile(path.join(root,'translations/zh',`${c.id}.md`),'utf8');
    const fm = {
      title: title(c,en), sourcePath: en ? 'README.md' : `translations/zh/${c.id}.md`,
      description: en ? `${c.title} — AI System Design by Amit Shekhar.` : `${c.zhTitle} —— AI 系统设计中英双语阅读版。`,
      prev: index ? {text:title(chapters[index-1],en),link:`/${prefix}guide/${chapters[index-1].id}`} : {text:en?'Contents':'全书目录',link:`/${prefix}contents`},
      next: index<chapters.length-1 ? {text:title(chapters[index+1],en),link:`/${prefix}guide/${chapters[index+1].id}`} : false
    };
    const other = `${en ? '' : 'en/'}guide/${c.id}.html`;
    const notice = en ? `[阅读本章中文译文](/${other}) · [Edition notes](/en/edition)` : `[Read this chapter in English](/${other}) · [翻译说明](/edition)`;
    await write(`${prefix}guide/${c.id}.md`,`---\n${JSON.stringify(fm,null,2)}\n---\n\n${notice}\n\n${roadmap(adapt(body,en),en).trim()}\n`);
  }
  const hero = en ? {
    name:'AI System Design',text:'From inference to production',tagline:'A practical guide to the systems behind AI. Read all 55 sections in English or Chinese, at your own pace.',
    actions:[{theme:'brand',text:'Start reading',link:'/en/guide/00-introduction'},{theme:'alt',text:'Browse contents',link:'/en/contents'}]
  } : {
    name:'AI 系统设计',text:'从模型推理，到生产落地',tagline:'围绕真实工程问题，串起 LLM、RAG、智能体与生产系统。55 个主题，中英对照，按自己的节奏阅读。',
    actions:[{theme:'brand',text:'开始阅读',link:'/guide/00-introduction'},{theme:'alt',text:'浏览全书目录',link:'/contents'},{theme:'alt',text:'Read in English',link:'/en/'}]
  };
  const features = en ? [
    ['Inference & infrastructure','GPU memory, latency, scaling, caching and model routing.'],['Retrieval & context','Embeddings, vector databases, RAG and context engineering.'],['Agents & tools','Tool calling, MCP, skills, memory and multi-agent systems.'],['Multimodal systems','Images, voice pipelines, real-time APIs and on-device inference.'],['Production engineering','Safety, privacy, evaluation, observability and cost control.'],['Practice & reference','Design frameworks, real cases, interview questions and a glossary.']
  ] : [
    ['推理与基础设施','理解 GPU 显存、延迟、扩展、缓存与模型路由。'],['检索与上下文','串起嵌入向量、向量数据库、RAG 与上下文工程。'],['智能体与工具','掌握工具调用、MCP、技能、记忆与多智能体协作。'],['多模态系统','探索图像、语音流水线、实时 API 与端侧推理。'],['生产环境工程','兼顾安全、隐私、评估、可观测性与成本。'],['实战与速查','设计框架、真实案例、面试题与关键概念术语表。']
  ];
  const targets=[11,22,30,37,38,48];
  const home={layout:'home',title:en?'AI System Design':'AI 系统设计',hero,features:features.map(([title,details],i)=>({title,details,link:`/${prefix}guide/${chapters[targets[i]].id}`,linkText:en?'Explore':'进入主题'}))};
  await write(`${prefix}index.md`,`---\n${JSON.stringify(home,null,2)}\n---\n\n<div class="home-note">${en?'Original guide by Amit Shekhar · Outcome School. Independent bilingual reading edition.':'原作：Amit Shekhar · Outcome School。本站为独立维护的中英双语阅读版。'} <a href="/ai-system-design/${prefix}edition.html">${en?'About this edition':'版本与翻译说明'}</a></div>\n`);
  let contents=`# ${en?'Contents & reading guide':'目录与阅读指南'}\n\n${en?'Read in order for a complete foundation, or jump to the problem you are working on. The language menu opens the corresponding chapter in the other language.':'初次阅读可以按顺序学习；解决具体问题时，可以直接进入对应主题。右上角语言菜单可以切换到当前章节的另一种语言。'}\n\n`;
  contents += en?'**Suggested routes:** Foundations → Inference → RAG → Agents → Production. For interview preparation, begin with the design framework and then consult the relevant chapters.\n\n':'**建议路线：** 基础 → 推理 → RAG → 智能体 → 生产工程。准备面试时，可以先读设计框架，再回到对应主题补充细节。\n\n';
  for (const g of groups) contents+=`## ${en?g.en:g.zh}\n\n`+chapters.slice(g.start,g.end).map(c=>`- [${title(c,en)}](/${prefix}guide/${c.id})`).join('\n')+'\n\n';
  await write(`${prefix}contents.md`,contents);
  const edition = en ? `# About this edition\n\nThis is an independent bilingual reading edition of [AI System Design](${manifest.sourceRepository}) by **Amit Shekhar / Outcome School**, maintained in [this fork](${repo}). It is not an official translation by the original author.\n\n- **English:** extracted from the original README without abridging the chapter content. The original table of contents is replaced by site navigation.\n- **Chinese:** complete AI-assisted translation of the chapter text, with terminology and formatting review. Please consult the corresponding English page when wording is ambiguous.\n- **Code and diagrams:** original code samples, ASCII diagrams, numbers and links are preserved. The learning-path Mermaid diagram is presented as a readable sequence in both languages, with its original source available below it.\n- **Source version:** commit [${manifest.sourceCommit.slice(0,7)}](${repo}/blob/${manifest.sourceCommit}/README.md), translated on ${manifest.translatedAt}. Claims, example model names, pricing and dates reflect the source version.\n- **License:** Apache License 2.0. Original copyright and attribution are preserved.\n\n## Maintain the translation\n\nEnglish source remains in README.md; Chinese chapters are in translations/zh. The build checks the source checksum to prevent silently publishing outdated translations after an English source update. See [SITE.md](${repo}/blob/main/SITE.md) for maintenance instructions.\n` : `# 版本与翻译说明\n\n本网站是 [AI System Design](${manifest.sourceRepository}) 的独立中英双语阅读版。原作者为 **Amit Shekhar / Outcome School**，本站在 [当前 Fork 仓库](${repo}) 中维护，并非原作者发布的官方译本。\n\n- **英文内容：** 从原始 README 按主题提取，保留章节正文；原有长目录由网站导航替代。\n- **中文内容：** 全文采用 AI 辅助翻译，并做了术语和格式校对；有歧义时可切换到本章英文核对。\n- **代码与图示：** 保留原始代码、ASCII 架构图、数值与参考链接。学习路径图转换为中英文步骤序列，并提供原始 Mermaid 源码。\n- **对应版本：** 原文提交 [${manifest.sourceCommit.slice(0,7)}](${repo}/blob/${manifest.sourceCommit}/README.md)，翻译日期为 ${manifest.translatedAt}。文中的观点、示例模型名称、价格与日期均对应这一版本。\n- **许可协议：** Apache License 2.0；保留原作者版权与署名。\n\n## 术语约定\n\n| English | 中文 |\n| --- | --- |\n| Agent / SubAgent | 智能体 / 子智能体 |\n| token | 保留 token，避免与鉴权令牌混淆 |\n| Inference / Prefill / Decode | 推理 / 预填充 / 解码 |\n| KV Cache | KV 缓存 |\n| Embedding / Reranking | 嵌入向量 / 重排序 |\n| Guardrails / Prompt Injection | 防护机制 / 提示注入 |\n| Memory (agents) | 记忆，与硬件内存区分 |\n| Observability / Evaluation | 可观测性 / 评估 |\n\n## 如何维护\n\n英文原文保留在 README.md，中文各章位于 translations/zh。构建时校验原文摘要，避免英文更新后静默发布过期中文。维护与本地预览方法见 [SITE.md](${repo}/blob/main/SITE.md)。\n`;
  await write(`${prefix}edition.md`,edition);
}
await fs.mkdir(path.join(root,'site/public/assets'),{recursive:true});
await fs.copyFile(path.join(root,'assets/banner.png'),path.join(root,'site/public/assets/banner.png'));
console.log(`Prepared ${chapters.length} chapters × 2 languages, plus home, contents and edition pages.`);
