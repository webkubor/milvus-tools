# 多语言 Schema

- Collection：`multilingual_docs`
- 维度：1024
- 字段：`language`、`is_translated`、`original_id`
- 指标：`COSINE`

适合多语言知识库、跨语言检索与翻译辅助场景。`cloneSchema(getPresetSchema('multilingual'), {...})` 可用于扩展。
