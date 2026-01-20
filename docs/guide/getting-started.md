# 快速开始

本指南将帮助你快速上手 Milvus Tools，在 5 分钟内搭建本地向量数据库。

## 环境要求

- **Node.js** >= 18.0
- **pnpm** >= 8.0
- **Docker** >= 20.10 (用于运行 Milvus)

## 安装

### 1. 克隆项目

```bash
git clone https://github.com/webkubor/milvus-tools.git
cd milvus-tools
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动 Milvus

```bash
# 创建 Milvus 目录
mkdir -p ~/Documents/milvus
cd ~/Documents/milvus

# 下载 docker-compose.yml
curl -O https://github.com/milvus-io/milvus/releases/download/v2.6.1/milvus-standalone-docker-compose.yml -o docker-compose.yml

# 启动服务
docker compose up -d
```

等待 Milvus 启动完成（约 1-2 分钟）。

## 快捷启动命令

| 命令 | 说明 |
|------|------|
| `pnpm run milvus:init` | 使用当前 Schema 和配置在 Milvus 中初始化 Collection。|
| `pnpm run milvus:ingest` | 使用配置的 Embedding Provider 批量写入向量数据。|
| `pnpm run milvus:search -- "关键词"` | 发送语义检索请求，快速验证数据。|
| `pnpm run milvus:smoke` | 检查 Milvus 连接与 Collection 健康状态。|

要快速体验完整流程，可以执行以下命令（假设 Milvus 与 Ollama 已启动）：

```bash
pnpm run milvus:init && \
EMBED_PROVIDER=ollama OLLAMA_MODEL=nomic-embed-text EMBEDDING_DIM=768 pnpm run milvus:ingest
```

之后运行 `pnpm run milvus:search -- "你的关键词"` 来验搜，`pnpm run milvus:smoke` 可随时确认服务健康。

## 快捷脚本

将常用命令包装成脚本，避免每次重复填写环境变量：

```bash
bash scripts/quick-launch.sh
```

脚本会先调用 `pnpm run milvus:init` 初始化 collection，然后默认使用 `ollama`（`nomic-embed-text`）批量入库。你可以通过设置 `OLLAMA_MODEL`、`EMBEDDING_DIM` 等环境变量覆盖默认值。

### 4. 配置 Ollama（可选，用于本地 Embedding）

```bash
# 安装 Ollama
brew install ollama

# 启动服务
brew services start ollama

# 拉取模型
ollama pull nomic-embed-text
```

## 基础使用

### 健康检查

验证 Milvus 服务是否正常运行：

```bash
pnpm run milvus:smoke
```

输出示例：

```
Milvus version: 2.6.0
Milvus health: true
Collections: ['rag_documents']
```

### 创建 Collection

使用预设 Schema 创建 Collection：

```bash
EMBEDDING_DIM=768 pnpm run milvus:init
```

### 入库文档

准备一些 Markdown 文档，然后入库：

```bash
# 创建示例文档目录
mkdir -p ~/Documents/my_docs
echo "# 示例文档\n\n这是一个测试文档的内容。" > ~/Documents/my_docs/test.md

# 更新配置文件中的数据源路径
# 编辑 config.json，设置 dataSource.root = "~/Documents/my_docs"

# 执行入库
EMBED_PROVIDER=ollama \
OLLAMA_MODEL=nomic-embed-text \
EMBEDDING_DIM=768 \
pnpm run milvus:ingest
```

### 语义检索

搜索相似文档：

```bash
EMBED_PROVIDER=ollama \
OLLAMA_MODEL=nomic-embed-text \
EMBEDDING_DIM=768 \
pnpm run milvus:search -- "测试文档"
```

## 示例

### 示例 1: 使用预设 Schema

```javascript
import { getPresetSchema, describeSchema } from '../../scripts/common/schemas.mjs'

// 获取 RAG 文档 Schema
const schema = getPresetSchema('rag')

// 查看详细信息
const desc = describeSchema(schema)
console.log(JSON.stringify(desc, null, 2))
```

### 示例 2: 自定义 Schema

```javascript
import { createSchema, varCharField, floatVectorField } from '../../scripts/common/schemas.mjs'

const customSchema = createSchema({
  collectionName: 'my_custom_collection',
  dimension: 1024,
  vectorFieldName: 'embedding',
  customFields: [
    varCharField('document_id', 64),
    floatVectorField('embedding', 1024),
    varCharField('content', 16384),
    varCharField('tags', 512)
  ]
})
```

### 示例 3: 克隆并修改预设

```javascript
import { cloneSchema, getPresetSchema, varCharField } from '../../scripts/common/schemas.mjs'

// 基于 RAG Schema 创建
const baseSchema = getPresetSchema('rag')

// 添加自定义字段
const mySchema = cloneSchema(baseSchema, {
  collectionName: 'extended_rag',
  dimension: 1536,
  addFields: [
    varCharField('author', 256),
    varCharField('category', 128)
  ]
})
```

## 脚本功能块

以下脚本分块组织了 Milvus 工具链的核心流程，方便你根据功能快速查找：

### Collection 管理
- `milvus:init` (`scripts/collection/milvus-init-collection.mjs`)：使用当前配置或 `EMBEDDING_DIM` 创建 collection、索引并加载，适合第一次初始化或扩容。  
- `milvus:rebuild` (`scripts/collection/milvus-rebuild.mjs`)：全量删除并重建 collection，通常搭配 `milvus:ingest` 做干净重建。  
- `milvus:smoke` (`scripts/health/milvus-smoke.mjs`)：检查 Milvus 版本、健康状态和已有 collection，便于快速验连。

### 数据切片与入库
- `milvus:ingest` (`scripts/ingest/milvus-ingest-ai-common.mjs`)：遍历 `AI_Common`、切片、Embedding（可选 Ollama/OpenAI/mock）并写入 Milvus。  
- `milvus-chunker.mjs`：Markdown 切片逻辑（标题拆分、长度控制），又位于 `scripts/ingest/milvus-chunker.mjs`。  
- `milvus-embed-ollama.mjs` / `milvus-embed-mock.mjs`：分别实现 Ollama 与 Mock Embedding 接口（同样在 `scripts/ingest/` 目录）。

### 语义检索
- `milvus:search` (`scripts/search/milvus-search.mjs`)：调用 Milvus 搜索并输出 Top-K 结果，用于验证入库质量或构建 RAG 查询链路。

### MCP 服务与工具
- `milvus-mcp-server.js`：MCP Server 实现（文档另见 [MCP 服务器指南](/guide/mcp-server)），可以暴露 Milvus 为 Claude/Gemini 可调用工具，当前位于 `scripts/mcp/milvus-mcp-server.js`。  
- `config-loader.mjs` / `schemas.mjs`：分别位于 `scripts/common/config-loader.mjs` 与 `scripts/common/schemas.mjs`，为各类脚本提供配置与 Schema 预设。

- 脚本和模块均已按功能归类到 `scripts/` 目录（例如 `scripts/collection/`、`scripts/ingest/`、`scripts/search/` 等），按需组合即可构建全量重建、语义搜和 MCP 接入的工作流。已有 `scripts/quick-launch.sh` 将 collection 初始化 + 入库打包成一条命令，适合快速实验。

## 下一步

- 📖 [Schema 预设详解](/schemas/) - 了解各种预设 Schema
- 🔧 [API 参考](/api/) - 查看完整 API 文档
- ⚙️ [配置文件说明](/guide/config) - 深入了解配置选项
- 🚀 [MCP 服务器](/guide/mcp-server) - 集成 AI 应用

## 常见问题

### Q: Milvus 启动失败？

**A:** 检查 Docker 服务是否运行，端口 19530 是否被占用：

```bash
docker ps
lsof -i :19530
```

### Q: Ollama embedding 很慢？

**A:** 调整并发数：

```bash
OLLAMA_CONCURRENCY=8 pnpm run milvus:ingest
```

### Q: 搜索结果不准确？

**A:** 检查 Embedding 模型和距离度量是否匹配：

- `nomic-embed-text` → `COSINE`
- `text-embedding-3-small` → `IP`

### Q: 如何更换 Embedding 模型？

**A:** 在 [config.json](../config.json) 中修改配置，然后全量重建：

```bash
EMBEDDING_DIM=1536 pnpm run milvus:rebuild
pnpm run milvus:ingest
```
