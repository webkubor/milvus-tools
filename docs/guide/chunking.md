# 文档切片（Chunking）

Milvus Tools 通过 `scripts/ingest/milvus-chunker.mjs` 实现 Markdown 切片：

- 按 `#` / `##` / `###` 结构分段，保留标题路径。
- 每段再按 `maxChars` 细分；不足 `minChars` 的片段会合并，避免过短。
- 最终输出带 `chunk_id`（sha1）、`title`、`section`、`content` 等字段，给入库脚本使用。

切片参数位于 `config.json.chunking`，支持 `minChars`、`maxChars`、`headingDelimiters` 等；也可通过环境变量（如 `MIN_CHARS`）在脚本中扩展。

在 `scripts/ingest/milvus-ingest-ai-common.mjs` 中调用切片器，随后执行 Embedding 与写入 Milvus。
