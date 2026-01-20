# RAG 文档 Schema

- Collection：`rag_documents`
- 维度：768
- 字段：`id`、`chunk_id`、`vector`、`content`、`title`、`section`、`path`、`doc_type`、`updated_at`
- 默认索引：`HNSW(COSINE)`（`M=16`、`efConstruction=200`）

适合知识库、RAG 问答和文档检索。可调用 `getPresetSchema('rag')` 或在 `scripts/common/schemas.mjs` 中直接读取。
