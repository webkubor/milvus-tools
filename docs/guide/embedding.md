# Embedding 提供商

Milvus Tools 目前支持两种 Embedding 方案：

- `ollama`：通过 `scripts/ingest/milvus-embed-ollama.mjs` 调用本地 Ollama HTTP 接口（默认 `http://127.0.0.1:11434`），并发度通过 `OLLAMA_CONCURRENCY` 控制。
- `mock`：使用 `scripts/ingest/milvus-embed-mock.mjs` 生成固定向量，便于测试或离线验证。

默认配置写在 `config.json.embedding` 中，可以选择 `provider`、`model`、`baseUrl`、`dimension`、`concurrency` 等；切换到 OpenAI 需扩展 embedding 模块并提供 `OPENAI_API_KEY`。
