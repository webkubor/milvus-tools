---
layout: home

hero:
  name: Milvus Tools
  text: 本地向量数据库解决方案
  tagline: 支持全量文档重建、语义检索和 RAG 注入
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /guide/getting-started#示例
  image:
    src: /logo.svg
    alt: Milvus Tools

features:
  - icon: 🚀
    title: 开箱即用
    details: 预设多种场景的 Schema，快速搭建向量数据库
  - icon: 📁
    title: 文档管理
    - 支持 Markdown 文档的智能切片和向量化
  - icon: 🔍
    title: 语义检索
    details: 支持本地和云端 embedding，高效相似度搜索
  - icon: 🔄
    title: 增量同步
    details: 支持全量重建和增量更新，灵活的数据管理
  - icon: ⚙️
    title: 高度可配置
    details: 统一的配置文件，环境变量覆盖，轻松定制
  - icon: 🔌
    title: MCP 协议
    details: 内置 MCP 服务器，支持 Claude 等 AI 应用
---

## 核心特性

### 🎯 专为 RAG 设计

内置 RAG 场景优化的 Schema 和工作流，让你快速构建知识库驱动的 AI 应用。

### 🧩 灵活的 Schema 系统

提供 8 种预设 Schema，覆盖常见应用场景。也可以基于预设快速自定义。

### 💻 命令行工具

提供完整的 CLI 工具集，支持健康检查、Collection 管理、数据入库、语义检索等。

### 🔌 MCP 协议支持

内置 Model Context Protocol 服务器，可直接与 Claude、Gemini 等 AI 应用集成。

## 快速体验

### 安装

```bash
# 克隆项目
git clone https://github.com/webkubor/milvus-tools.git
cd milvus-tools

# 安装依赖
pnpm install
```

### 使用预设 Schema

```javascript
import { getPresetSchema } from '../scripts/common/schemas.mjs'

// 获取 RAG 文档 Schema
const schema = getPresetSchema('rag')
console.log(schema.collectionName)  // 'rag_documents'
```

### 创建 Collection

```bash
# 使用预设 Schema 初始化
pnpm run milvus:init

# 全量入库文档
EMBED_PROVIDER=ollama pnpm run milvus:ingest

# 语义检索
EMBED_PROVIDER=ollama pnpm run milvus:search -- "搜索关键词"
```

## 适用场景

| 场景 | 推荐预设 | 说明 |
|-----|---------|------|
| 知识库问答 | `rag` | 文档切片、语义检索 |
| 代码搜索 | `code` | 代码片段、函数搜索 |
| 图像检索 | `image` | 以图搜图、图像标注 |
| 多语言 | `multilingual` | 国际化知识库 |
| 对话系统 | `conversation` | 聊天历史、上下文检索 |
| 商品推荐 | `product` | 电商商品向量搜索 |

## 技术栈

- **Milvus** - 高性能向量数据库
- **Ollama** - 本地 Embedding 服务
- **MCP** - Model Context Protocol
- **Node.js** - 运行时环境

## 文档导航

- 📖 [快速开始](/guide/getting-started) - 5 分钟上手
- 🎨 [Schema 预设](/schemas/) - 预设 Schema 详解
- 🔧 [API 参考](/api/) - 完整 API 文档
- ⚙️ [配置指南](/guide/config) - 配置文件说明
