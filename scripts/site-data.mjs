import fs from 'node:fs';
export const manifest = JSON.parse(fs.readFileSync(new URL('../translations/manifest.json', import.meta.url), 'utf8'));
export const chapters = manifest.chapters;
export const repo = 'https://github.com/a-persimmons/ai-system-design';
export const base = '/ai-system-design/';
export const groups = [
  { zh: '从这里开始', en: 'Start here', start: 0, end: 9 },
  { zh: '推理与基础设施', en: 'Inference & infrastructure', start: 9, end: 21 },
  { zh: '检索与应用服务', en: 'Retrieval & application serving', start: 21, end: 30 },
  { zh: '智能体与多模态', en: 'Agents & multimodal systems', start: 30, end: 38 },
  { zh: '生产环境工程', en: 'Production engineering', start: 38, end: 48 },
  { zh: '实战与速查', en: 'Practice & reference', start: 48, end: 55 }
];
export function sidebar(en) {
  const prefix = en ? '/en/' : '/';
  return [
    { text: en ? 'Contents & reading guide' : '目录与阅读指南', link: `${prefix}contents` },
    ...groups.map(g => ({ text: en ? g.en : g.zh, collapsed: g.start !== 0,
      items: chapters.slice(g.start,g.end).map(c => ({ text: en ? c.title : c.zhTitle, link: `${prefix}guide/${c.id}` })) })),
    { text: en ? 'About this edition' : '版本与翻译说明', link: `${prefix}edition` }
  ];
}
