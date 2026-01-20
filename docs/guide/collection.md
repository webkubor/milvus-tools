# Collection 管理

Milvus Tools 用脚本封装 Collection 生命周期：

- `pnpm run milvus:init`：调用 `scripts/collection/milvus-init-collection.mjs`，根据 `EMBEDDING_DIM` 创建 Collection、字段、索引并 `load`。
- `pnpm run milvus:rebuild`：在现有 Collection 上先 `drop`，再复用 init 脚本完成干净重建，常在模型或 schema 变动后使用。
- `pnpm run milvus:smoke`：查看当前 Milvus 版本、健康与 collection 列表，确认 Collection 是否就绪。

数据库参数（名称、地址）由 `config.json.milvus` 控制，并可通过 `MILVUS_HOST` / `MILVUS_PORT` / `MILVUS_COLLECTION` 环境变量覆盖。
