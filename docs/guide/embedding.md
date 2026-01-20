# Embedding 提供商

Milvus Tools 目前支持两种 Embedding 方案：

- `ollama`：通过 `scripts/ingest/milvus-embed-ollama.mjs` 调用本地 Ollama HTTP 接口（默认 `http://127.0.0.1:11434`），并发度通过 `OLLAMA_CONCURRENCY` 控制。
- `mock`：使用 `scripts/ingest/milvus-embed-mock.mjs` 生成固定向量，便于测试或离线验证。

### 🎯 默认模型

当前默认配置是 `EMBED_PROVIDER=ollama`，`OLLAMA_MODEL=nomic-embed-text`（768 维），并写在 `config.json.embedding.ollama` 中。只要 Ollama 启动并拉取了 `nomic-embed-text`，`pnpm run milvus:ingest` 会透明调用该模型；若要替换模型，需同步调整 `OLLAMA_MODEL` 与 `EMBEDDING_DIM`（确保维度一致），然后先运行 `pnpm run milvus:rebuild` 再 `pnpm run milvus:ingest`。

### 🌐 修改策略

要切换到 OpenAI 或其他 provider，把 `embedding.provider` 改为目标名称（如 `openai`），配置好对应的 `model`/`apiKey`，并保证 `EMBEDDING_DIM` 与模型维度匹配。`config.json.embedding` 提供 `provider`、`baseUrl`、`dimension`、`concurrency` 等字段，MCP 与 CLI 脚本会共享该配置。
