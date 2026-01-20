#!/usr/bin/env bash
set -euo pipefail

# 快速初始化 Milvus collection
pnpm run milvus:init

echo "Milvus Collection 初始化完成"

# 批量导入文档向量，按需调整 Embedding 相关变量
EMBED_PROVIDER=ollama \
OLLAMA_MODEL=${OLLAMA_MODEL:-nomic-embed-text} \
EMBEDDING_DIM=${EMBEDDING_DIM:-768} \
pnpm run milvus:ingest

echo "向量写入完成，推荐运行 pnpm run milvus:search -- \"关键词\" 以验证。"
