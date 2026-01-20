# 索引优化

Collection 索引通过 `scripts/collection/milvus-init-collection.mjs` 中的 `index` 定义控制：

- 当前默认索引为 `HNSW`，`metric_type` 为 `COSINE`。
- `index.params` 包含 `M` / `efConstruction`，可根据数据量和查询延迟进行微调。
- `config.json.index` 同步控制 `type`、`metricType`、`params`，保证 `ingest` 与 `search` 使用一致的搜索度量。

重建索引时使用 `pnpm run milvus:rebuild`，会先 `dropCollection` 再 `loadCollectionSync`。如果希望使用 `IVF` 系列，可以在脚本中修改 `index_type` 并调整其他参数。
