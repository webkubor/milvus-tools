# Ingestor 模块

`scripts/ingest/milvus-ingest-ai-common.mjs` 是当前的 Ingestor 实现：

1. 扫描 `AI_COMMON_ROOT` 文档，调用切片器构建 chunk。
2. 调用 Embedding provider 生成向量。
3. 批量写入 Milvus collection，包含 `vector`、`content`、`path`、`title` 等字段。
4. 支持 `--dry-run` 模式，仅输出 chunk 信息。

`config.json` 控制数据源、chunking、index、embedding、batchSize 等行为。
