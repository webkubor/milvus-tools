# 语义检索

`pnpm run milvus:search -- "关键词"` 会调用 `scripts/search/milvus-search.mjs`：

- 使用 Embedding（默认为 Ollama）将输入转换为向量。
- 调用 Milvus 的 `search` 接口，`metric_type` 为 `COSINE`、`limit` 由 `TOPK` 控制。
- 支持 `output_fields` 返回 `path/title/section/content` 等字段，方便构建 RAG prompt。

`TOPK`、`EMBED_PROVIDER`、`OLLAMA_MODEL` 和 `OLLAMA_BASE_URL` 都可通过环境变量覆盖，`pnpm run milvus:smoke` 可用于查看 collection 已加载后再搜索。
