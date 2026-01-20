# 配置指南

Milvus Tools 的所有行为都由仓库根目录的 `config.json` 控制：Milvus 地址与 collection、文本切片规则、Embedding 模型、搜索参数等都写在这里。每次运行 CLI 脚本（`pnpm run milvus:*`）前都自动读取该文件；你可以在编辑器中打开 `config.json`（或运行 `cat config.json`）确认默认值，也可以通过环境变量覆盖其中的字段。

> 新手提示：如果还没看过 `config.json`，先用 `cat config.json` 或打开 VSCode/IDE 里的文件，按 Section（milvus、dataSource、embedding 等）逐块理解当前默认配置，再去调用脚本。很多问题都可以在这里发现，例如 embedding 维度是否匹配、Milvus 地址是否指向 127.0.0.1:19530。

## 配置结构一览

```json
{
  "milvus": { ... },
  "dataSource": { ... },
  "embedding": { ... },
  "chunking": { ... },
  "search": { ... },
  "ingest": { ... },
  "index": { ... }
}
```

### milvus

| 字段 | 说明 |
|------|------|
| `address` | Milvus 服务器地址，默认 `127.0.0.1:19530`。|
| `collection` | 默认 collection 名称，例如 `ai_common_chunks`。|
| `docker.composePath` | 本地 docker-compose 文件所在目录，用于 `milvus-init` 时的路径提示。|
| `docker.serviceName` | Docker Compose 服务名。|
| `docker.attuUrl` | Attu UI 地址。

> 可以通过 `MILVUS_HOST`、`MILVUS_PORT`、`MILVUS_COLLECTION` 环境变量覆盖运行时连接信息。

### dataSource

| 字段 | 说明 |
|------|------|
| `root` | 文档根目录，默认 `~/Documents/AI_Common`，会递归扫描 Markdown 文件。|
| `filePatterns` | 需要处理的文件 glob。|
| `privacyExcludeFile` | 排除文件列表，处理入库前会读取此文件确定需忽略的路径或关键词。|

### embedding

包含各 Embedding 提供商的设置：

- `provider`：当前默认值 `ollama`（可以切换到 `openai`）。
- `ollama`、`openai` 里分别定义 `baseUrl`、`model`、`dimension`、`concurrency`（推理并发）。

> 切换到 `openai` 时需要在环境变量中填写 `OPENAI_API_KEY`。

### chunking

- `minChars` / `maxChars` 控制切片的字数范围。
- `headingDelimiters` 用于识别 Markdown 标题以分段。

### search

- `topK`：相似度查询返回的最大条数。
- `metricType`：使用的距离度量（`COSINE`、`L2`、`IP`）。

### ingest

- `batchSize`：每批提交向量的数量。

### index

- `type`：Milvus 支持的索引类型，如 `HNSW` 或 `IVF_FLAT`。
- `metricType`：搜索时使用的度量；建议 `/index.metricType` 与 `/search.metricType` 保持一致。
- `params`：根据具体索引调整，比如 `HNSW` 下的 `M`/`efConstruction`。

## 配置覆盖示例

```bash
MILVUS_HOST=milvus.local \
MILVUS_PORT=19530 \
EMBEDDING_DIM=1536 \
OLLAMA_MODEL=nomic-embed-text \
pnpm run milvus:ingest
```

变量解释：
- `EMBEDDING_DIM` 与当前 Schema 中的向量维度一致。
- `OLLAMA_MODEL` 可切换至你预先下载的 Embedding 模型。

## 多环境建议

- 使用 `config.json` 保存开发环境默认值。
- 使用 `.env.local`/shell 环境变量调整生产参数（Milvus 地址、Embedding 模型等）。
- 每次全量重建前确认 `config.json.chunking` 与文档结构匹配，避免生成过短或过长的 chunk。
