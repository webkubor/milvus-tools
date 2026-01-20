# Embedding 模块

主要入口：`scripts/ingest/milvus-embed-ollama.mjs` 与 `scripts/ingest/milvus-embed-mock.mjs`。

- Ollama 实现通过 HTTP `POST /api/embeddings` 获取向量，可设置 `model`、`baseUrl`、`concurrency`。
- Mock 实现返回固定向量数组，便于干跑或离线测试。
- `milvus-ingest` 脚本根据 `EMBED_PROVIDER` 环境变量切换服务。

将来可新增 `scripts/ingest/milvus-embed-openai.mjs` 等 provider。
