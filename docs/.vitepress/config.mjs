import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Milvus Tools',
  description: '本地向量数据库解决方案，支持全量文档重建、语义检索和 RAG 注入',
  lang: 'zh-CN',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'API 参考', link: '/api/' },
      { text: 'Schema 预设', link: '/schemas/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装配置', link: '/guide/installation' },
            { text: '环境依赖', link: '/guide/dependencies' }
          ]
        },
        {
          text: '使用指南',
          items: [
            { text: '创建 Collection', link: '/guide/collection' },
            { text: '文档切片', link: '/guide/chunking' },
            { text: '向量入库', link: '/guide/ingest' },
            { text: '语义检索', link: '/guide/search' }
          ]
        },
        {
          text: '高级用法',
          items: [
            { text: '配置文件', link: '/guide/config' },
            { text: 'Embedding 提供商', link: '/guide/embedding' },
            { text: '索引优化', link: '/guide/indexing' },
            { text: 'MCP 服务器', link: '/guide/mcp-server' }
          ]
        }
      ],
      '/api/': [
        { text: '概述', link: '/api/' },
        { text: 'Chunker', link: '/api/chunker' },
        { text: 'Embedding', link: '/api/embedding' },
        { text: 'Ingestor', link: '/api/ingestor' },
        { text: 'Searcher', link: '/api/searcher' },
        { text: 'Collection', link: '/api/collection' },
        { text: 'Schema', link: '/api/schema' }
      ],
      '/schemas/': [
        { text: 'Schema 预设', link: '/schemas/' },
        { text: 'RAG 文档', link: '/schemas/rag' },
        { text: '代码搜索', link: '/schemas/code' },
        { text: '图像检索', link: '/schemas/image' },
        { text: '多语言', link: '/schemas/multilingual' },
        { text: '对话系统', link: '/schemas/conversation' },
        { text: '自定义 Schema', link: '/schemas/custom' }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/webkubor/milvus-tools' }
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2024 Milvus Tools'
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: '搜索',
              buttonAriaLabel: '搜索文档'
            }
          }
        }
      }
    }
  },

  markdown: {
    codeTransformers: [
      {
        post(code, id) {
          if (/demo-preview/.test(id)) {
            return code.replace(/<!--prettier-ignore-->\n/, '')
          }
          return code
        }
      }
    ]
  }
})