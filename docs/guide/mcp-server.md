# MCP 服务器指南

Milvus Tools 附带一个 Model Context Protocol (MCP) 服务器，方便 Claude、Gemini 等 AI 应用通过标准协议读取 Milvus 数据。服务器运行 `milvus-mcp-server.js`，默认使用 Ollama 做 local embedding。

## 运行前准备

1. 确保 Milvus 通过 Docker Compose 启动，并且 `config.json.milvus.address` 指向正确主机。
2. 启动 Ollama（或其他支撑 Embedding 的服务）并拉取对应模型。
3. 安装依赖：`pnpm install`（如果还没执行过）。

## 启动服务器

```bash
MILVUS_HOST=127.0.0.1 \
MILVUS_PORT=19530 \
OLLAMA_MODEL=nomic-embed-text \
OLLAMA_BASE_URL=http://127.0.0.1:11434 \
EMBEDDING_DIM=768 \
node scripts/mcp/milvus-mcp-server.js
```

- `EMBEDDING_DIM` 必须与你当前使用的 Schema 向量维度一致。
- `OLLAMA_MODEL` 可以是你已拉取的模型，如 `nomic-embed-text`。
- 支持通过 `TOPK` 指定返回的 Top-K 大小。

启动后，MCP 服务器会监听标准输入/输出协议，可以被 Claude 等模型作为外部工具直接调用。你也可以在本地通过 `curl` 或 Postman 验证：

```bash
curl --request POST \
  --header "content-type: application/json" \
  --data '{"name":"list_tools"}' \
  http://localhost:8000/
```

## 常见问题

- **无法连接 Milvus？** 确认 Docker Compose 中 Milvus 服务已经 `docker compose ps` 显示为 `running`，且 `config.json.milvus.address` 与 `MILVUS_HOST`/`MILVUS_PORT` 一致。
- **Embedding 请求失败？** 检查 Ollama HTTP 接口（默认 `11434`）是否可达，可以用 `curl http://127.0.0.1:11434/api/tags`。
- **想切换到 OpenAI？** 设置 `provider` 为 `openai`，并通过 `OPENAI_API_KEY` 环境变量提供密钥。MCP 服务器当前只演示 Ollama，因此你需要在代码中拓展 Embedding 逻辑。
