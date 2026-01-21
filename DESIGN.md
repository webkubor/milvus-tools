# Milvus Tools npm 工具化设计方案

## 目标

将当前项目改造为可复用的 npm 包，支持：
- **SDK 使用**：作为 npm 依赖在其他项目中使用
- **CLI 使用**：提供命令行工具快速操作
- **高度可配置**：支持自定义字段、切片规则等

## 当前架构分析

### 现有模块

| 模块 | 功能 | 通用性 |
|-----|------|--------|
| `scripts/ingest/milvus-chunker.mjs` | Markdown 切片 | ⭐⭐⭐ 高度通用 |
| `scripts/ingest/milvus-embed-mock.mjs` | Mock embedding | ⭐⭐ 开发工具 |
| `scripts/ingest/milvus-embed-ollama.mjs` | Ollama embedding | ⭐⭐⭐ 高度通用 |
| `scripts/collection/milvus-init-collection.mjs` | Collection 初始化 | ⭐⭐ 中等（需解耦 schema） |
| `scripts/ingest/milvus-ingest-ai-common.mjs` | 数据入库 | ⭐ 低（强耦合业务逻辑） |
| `scripts/search/milvus-search.mjs` | 向量搜索 | ⭐⭐⭐ 高度通用 |
| `scripts/collection/milvus-rebuild.mjs` | 重建 collection | ⭐⭐ 中等通用 |
| `scripts/mcp/milvus-mcp-server.js` | MCP 服务器 | ⭐⭐⭐ 高度通用 |

## 改造方案

### 1. 包结构设计

```
milvus-tools/
├── src/
│   ├── chunker/
│   │   └── index.mjs          # 通用切片器
│   ├── embedding/
│   │   ├── base.mjs           # Embedding Provider 接口
│   │   ├── mock.mjs           # Mock 实现
│   │   ├── ollama.mjs         # Ollama 实现
│   │   └── openai.mjs         # OpenAI 实现（新增）
│   ├── ingest/
│   │   ├── index.mjs          # 通用入库器
│   │   └── scanner.mjs        # 文件扫描器
│   ├── search/
│   │   └── index.mjs          # 通用搜索器
│   ├── collection/
│   │   └── index.mjs          # Collection 管理
│   ├── config/
│   │   └── loader.mjs         # 配置加载器
│   └── index.mjs              # 主入口
├── cli/
│   ├── smoke.js                # CLI: 健康检查
│   ├── init.js                 # CLI: 初始化
│   ├── ingest.js               # CLI: 入库
│   └── search.js               # CLI: 搜索
├── examples/
│   ├── basic-usage.mjs         # SDK 使用示例
│   └── custom-schema.mjs       # 自定义 schema 示例
├── package.json
├── config.template.json        # 配置模板
└── README.md
```

### 2. 核心 API 设计

#### 切片器 (Chunker)

```javascript
import { Chunker } from '@yourname/milvus-tools'

// 基础使用
const chunker = new Chunker()
const chunks = await chunker.chunk({
  content: markdownText,
  minChars: 200,
  maxChars: 1200,
  headingDelimiters: ['#', '##', '###']
})

// 自定义切片策略
const customChunker = new Chunker({
  strategy: 'custom',
  splitter: (text) => { /* 自定义逻辑 */ }
})
```

#### Embedding Provider

```javascript
import { OllamaEmbedding, OpenAIEmbedding } from '@yourname/milvus-tools'

// 使用 Ollama
const embedding = new OllamaEmbedding({
  baseUrl: 'http://127.0.0.1:11434',
  model: 'nomic-embed-text',
  dimension: 768,
  concurrency: 4
})
const vectors = await embedding.embed(['text1', 'text2'])

// 使用 OpenAI
const openaiEmbedding = new OpenAIEmbedding({
  apiKey: 'sk-xxx',
  model: 'text-embedding-3-small'
})
```

#### 入库器 (Ingestor)

```javascript
import { Ingestor } from '@yourname/milvus-tools'

const ingestor = new Ingestor({
  milvus: { address: '127.0.0.1:19530', collection: 'my_docs' },
  embedding: new OllamaEmbedding({...}),
  chunker: new Chunker({...}),
  schema: {
    fields: [
      { name: 'id', type: 'Int64', is_primary_key: true, autoID: true },
      { name: 'vector', type: 'FloatVector', dim: 768 },
      { name: 'content', type: 'VarChar', max_length: 8192 }
      // ... 其他字段
    ]
  },
  transform: (chunk, fileMeta) => ({
    // 自定义字段映射
    content: chunk.content,
    vector: chunk.vector,
    metadata: { source: fileMeta.path }
  })
})

// 从文件入库
await ingestor.ingestFiles('/path/to/docs', ['*.md'])

// 直接入库
await ingestor.ingest(chunks)
```

#### 搜索器 (Searcher)

```javascript
import { Searcher } from '@yourname/milvus-tools'

const searcher = new Searcher({
  milvus: { address: '127.0.0.1:19530', collection: 'my_docs' },
  embedding: new OllamaEmbedding({...})
})

const results = await searcher.search({
  query: '搜索关键词',
  topK: 10,
  filter: 'metadata.source == "project_a.md"'
})
```

### 3. Schema 配置化

#### 内置 Schema

```javascript
import { PRESET_SCHEMAS } from '@yourname/milvus-tools'

// RAG 文档 Schema
PRESET_SCHEMAS.RAG_DOCUMENT

// 简单文本 Schema
PRESET_SCHEMAS.SIMPLE_TEXT

// 完整元数据 Schema
PRESET_SCHEMAS.FULL_METADATA
```

#### 自定义 Schema

```javascript
const customSchema = {
  collectionName: 'custom_collection',
  fields: [
    {
      name: 'id',
      type: 'Int64',
      is_primary_key: true,
      autoID: true
    },
    {
      name: 'vector',
      type: 'FloatVector',
      dim: 768
    },
    {
      name: 'content',
      type: 'VarChar',
      max_length: 16384  // 更大的字段
    },
    {
      name: 'custom_field',
      type: 'VarChar',
      max_length: 256
    },
    {
      name: 'json_metadata',  // JSON 字段
      type: 'JSON'
    }
  ]
}
```

### 4. CLI 设计

```bash
# 安装
npm install -g @yourname/milvus-tools

# 健康检查
milvus health

# 初始化 Collection（使用预设 schema）
milvus init --collection my_docs --schema rag

# 初始化 Collection（使用自定义 schema）
milvus init --collection my_docs --schema ./my-schema.json

# 入库
milvus ingest \
  --source /path/to/docs \
  --pattern "*.md" \
  --embedding ollama \
  --model nomic-embed-text

# 搜索
milvus search "搜索关键词" --topk 5

# 重建
milvus rebuild --collection my_docs
```

### 5. 配置文件支持

#### milvus.config.json

```json
{
  "milvus": {
    "address": "127.0.0.1:19530"
  },
  "collections": {
    "default": {
      "name": "my_docs",
      "embedding": {
        "provider": "ollama",
        "model": "nomic-embed-text"
      },
      "schema": "rag"
    }
  },
  "chunking": {
    "minChars": 200,
    "maxChars": 1200
  }
}
```

## 6. Milvus 本机 UI（Attu）使用指南

> 目标：当你说“milvus / 打开 Milvus / 看向量数据库界面”时，AI 能直接把你带到可用的 UI 页面（而不是打开 health 页）。

### 6.1 你要看的“Milvus 页面”是什么？

- Milvus（向量数据库）本体：默认只暴露 gRPC（`127.0.0.1:19530`）+ health（`127.0.0.1:9091/healthz`）
- 可视化 UI：使用 Attu（Milvus 的管理界面）

### 6.2 本机入口

- Attu UI：`http://127.0.0.1:8000`

> 如果页面提示连接 Milvus，一般默认值是 `milvus-standalone:19530`（docker compose 内网），也可填 `127.0.0.1:19530`。

### 6.3 AI 自动化约定（给 Codex/Gemini 都能用）

#### 触发词
- 用户只说：`milvus`
- 或包含："打开 Milvus" / "看 Milvus UI" / "向量数据库界面"

#### 自动化动作（优先 Chrome DevTools MCP，保留标签页）
1. 在 Chrome 打开：`http://127.0.0.1:8000/#/connect`（或直接 `http://127.0.0.1:8000`）
2. 如停留在连接页，点击“连接”
3. 成功标志：页面出现数据库/collection 列表入口（例如显示 `default` 数据库与 collection 数量）

### 6.4 常见问题
- Q：为什么不直接打开 health 页？
  - A：health 只用于运维诊断，你的目标是“看界面管理 collection/数据”，所以默认打开 Attu。
- Q：Attu 是开源的吗？
  - A：Attu 2.6.x 起官方声明不再开源；但本机开发使用通常没问题。如果你有严格的开源合规要求，需要另行选型（或使用旧版本/替代 UI）。

## 迁移计划

### 阶段 1：核心模块重构（1-2天）

- [ ] 提取 `Chunker` 为独立模块
- [ ] 统一 `EmbeddingProvider` 接口
- [ ] 重构 `Ingestor` 支持自定义 schema
- [ ] 提取 `Searcher` 为独立模块

### 阶段 2：SDK 导出（1天）

- [ ] 创建主入口文件 `src/index.mjs`
- [ ] 导出所有核心类和预设
- [ ] 编写 JSDoc 注释
- [ ] 创建使用示例

### 阶段 3：CLI 工具（1天）

- [ ] 使用 commander 或 yargs 构建 CLI
- [ ] 实现 `health`、`init`、`ingest`、`search` 命令
- [ ] 添加配置文件支持

### 阶段 4：文档和测试（1天）

- [ ] 编写 API 文档
- [ ] 编写 CLI 文档
- [ ] 添加单元测试
- [ ] 准备 npm 发布

## 开放性问题

### 1. 是否需要支持其他文档格式？

- PDF、Word、HTML 等
- 建议：设计 `DocumentParser` 接口，支持扩展

### 2. 是否需要支持其他向量数据库？

- Qdrant、Chroma、Pinecone 等
- 建议：先专注 Milvus，但设计 `VectorStore` 接口预留扩展性

### 3. 如何处理 schema 变更？

- 当前：全量重建
- 建议：提供 schema migration 工具

### 4. 是否需要支持流式处理？

- 大文件、大量数据的处理
- 建议：提供 `StreamIngestor` 类

## 命名建议

- `milvus-tools` - 通用但可能冲突
- `@yourname/milvus-tools` - 避免冲突
- `@yourname/milvus-rag` - 更聚焦 RAG 场景
- `@yourname/milvus-store` - 强调存储功能