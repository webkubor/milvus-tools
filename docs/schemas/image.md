# 图像检索 Schema

- Collection：`image_search`
- 维度：512，适合图像 embedding
- 额外字段：`image_id`、`image_path`、`width`、`height`、`labels`（JSON）、`caption`
- 索引：`HNSW(L2)`，偏重图像 similarity

用于以图搜图、图像标注和视觉检索任务。可选 `jsonField('labels')` 存储多 label。
