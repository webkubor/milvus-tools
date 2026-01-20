# Chunker 模块

描述：`scripts/ingest/milvus-chunker.mjs` 提供针对 Markdown 的切片算法。

- `chunkMarkdown({ filePath, markdown, minChars, maxChars })`
- 产生 `chunk_id`（sha1）、`path`、`title`、`section`、`content` 等字段
- 支持多级标题、自动合并短 chunk、拆分过长内容

可在自定义入库器中复用该模块，嵌入其他数据源的流程中。
