# 向量入库

`pnpm run milvus:ingest` 负责将 `~/Documents/AI_Common` 下的 Markdown 文档切片、Embedding 后写入 Milvus。

流程：
1. 递归扫描 `AI_COMMON_ROOT` 中的 `.md`，过滤 `.DS_Store` 与 `privacy_excludes.md` 中列出的路径。
2. 对每个文件调用 `chunkMarkdown` 生成 chunk，合并元信息（path、section、doc_type、updated_at）。
3. 根据 `EMBED_PROVIDER`（默认为 `ollama`，可选 `mock`）获取向量。
4. 按批次写入 Milvus `ai_common_chunks`，字段含 `chunk_id`、`vector`、`content` 等。
5. 完成后 `flush` 保证查询可见。

`config.json.ingest.batchSize` 控制写入批量，`EMBEDDING_DIM` 必须与当前 Schema 匹配。干跑模式 `pnpm run milvus:ingest -- --dry-run` 只输出 chunk 统计，不做写入。
