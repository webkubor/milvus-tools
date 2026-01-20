# Searcher 模块

`scripts/search/milvus-search.mjs` 处理用户查询：

- 将输入通过 embedding（默认 Ollama）转换为向量。
- 调用 Milvus `search`，`metric_type= COSINE`，`limit` 可由 `TOPK` 控制。
- 输出 JSON，包含 `chunk_id`、`path`、`content` 等字段，直接用于 RAG prompt。

支持额外的请求参数与字段过滤，可作为基线 / CLI 搜索工具。
