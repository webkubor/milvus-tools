# Collection 模块

`milvus-init-collection.mjs` 配置 Collection 和索引：

- 定义字段：`id`(主键)、`chunk_id`、`vector`、`content`、`title`、`section`、`path`、`doc_type`、`updated_at`。
- 索引采用 `HNSW(COSINE)`，`params` 包括 `M`/`efConstruction`。
- 调用 `MilvusClient.loadCollectionSync` 确保 collection 已加载。

`milvus-rebuild.mjs` 先 drop，再复用 init 逻辑；`config.json.index` 控制 `type`、`params` 等。
