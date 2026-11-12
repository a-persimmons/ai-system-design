import { defineConfig } from 'vitepress';
import { base, repo, sidebar } from '../../scripts/site-data.mjs';
function locale(en: boolean) {
  const p=en?'/en/':'/';
  return {
    label: en ? 'English' : '简体中文', lang: en?'en-US':'zh-CN', title: en?'AI System Design':'AI 系统设计',
    description: en?'A complete bilingual guide to AI system design, from LLM inference to production.':'AI 系统设计中英双语指南：从 LLM 推理、RAG、智能体到生产环境工程。',
    themeConfig: {
      nav:[{text:en?'Home':'首页',link:p},{text:en?'Contents':'全书目录',link:`${p}contents`},{text:en?'Glossary':'术语速查',link:`${p}guide/52-ai-system-design-key-concepts-glossary`},{text:en?'About':'版本说明',link:`${p}edition`}],
      sidebar:sidebar(en),
      outline:{level:[2,3],label:en?'On this page':'本页目录'},
      docFooter:{prev:en?'Previous chapter':'上一章',next:en?'Next chapter':'下一章'},
      sidebarMenuLabel:en?'Chapters':'章节目录', returnToTopLabel:en?'Back to top':'返回顶部',
      darkModeSwitchLabel:en?'Appearance':'外观', lightModeSwitchTitle:en?'Switch to light theme':'切换浅色模式',darkModeSwitchTitle:en?'Switch to dark theme':'切换深色模式',
      langMenuLabel:en?'Change language':'切换语言',skipToContentLabel:en?'Skip to content':'跳转到正文',
      editLink:{pattern:(page:any)=>`https://github.com/a-persimmons/ai-system-design/edit/main/${page.frontmatter.sourcePath ?? 'SITE.md'}`,text:en?'Edit this page on GitHub':'在 GitHub 编辑本页'},
      footer:{message:en?'Independent bilingual edition · Apache License 2.0':'独立中英双语阅读版 · Apache License 2.0',copyright:'Copyright © 2026 Outcome School · Original author: Amit Shekhar'}
    }
  };
}
export default defineConfig({
  base,cleanUrls:false,locales:{root:locale(false),en:locale(true)},
  head:[['link',{rel:'icon',type:'image/svg+xml',href:`${base}favicon.svg`}],['meta',{name:'theme-color',content:'#245c9f'}]],
  themeConfig:{
    logo:'/favicon.svg',siteTitle:'AI System Design',socialLinks:[{icon:'github',link:repo}],
    search:{provider:'local',options:{
      miniSearch:{options:{tokenize:(text:string)=>Array.from(new Intl.Segmenter('zh',{granularity:'word'}).segment(text)).filter(w=>w.isWordLike).map(w=>w.segment)}},
      locales:{root:{translations:{
        button:{buttonText:'搜索全书',buttonAriaLabel:'搜索全书'},
        modal:{displayDetails:'显示详细列表',resetButtonTitle:'清除搜索',backButtonTitle:'返回',noResultsText:'没有找到相关内容',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'}}
      }}}
    }}
  }
});
