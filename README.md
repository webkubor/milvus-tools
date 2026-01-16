# milvus-tools（本机向量知识库工具箱）

> 目标：把 `~/Documents/AI_Common` 作为“根（Source of Truth）”，通过 **全量重建** 的方式，把内容切片、向量化并写入本机 **Milvus**，用于后续语义检索与 RAG 注入。

## 0. 目录结构

- Milvus Docker Compose：`~/Documents/milvus/docker-compose.yml`
- 本工具目录：`~/Documents/milvus-tools/`
- 长期记忆（数据源）：`~/Documents/AI_Common/`

## 1. 安装与启动（Milvus）

### 1.1 启动 Docker Desktop

先确保 Docker Desktop 已启动（否则 `docker compose` 会报无法连接 daemon）。

### 1.2 启动 Milvus（standalone）

```bash
cd ~/Documents/milvus
docker compose up -d
```

常用检查：

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | rg -n "milvus-(standalone|minio|etcd|attu)"
```

### 1.3 打开 Milvus UI（Attu，可选）

- 地址：`http://127.0.0.1:8000`
- 默认连接地址（通常自动填好）：`milvus-standalone:19530`

> 备注：Attu 在 2.6.x 起官方声明不再开源，但本机开发使用一般没问题；

## 2. 安装与启动（本地免费 embedding：Ollama）

本项目默认使用 **本地 Ollama** 做 embedding（免费策略），避免 API Key 与按量付费。

- Ollama 官网：`https://ollama.com`
- 本项目使用的 embedding 模型：`nomic-embed-text`（维度 768）

### 2.1 安装与启动

```bash
brew install ollama
brew services start ollama
```

### 2.2 拉取 embedding 模型

```bash
ollama pull nomic-embed-text
```

### 2.3 验证 Ollama 服务

```bash
curl -fsS http://127.0.0.1:11434/api/tags | head -n 1
```

### 2.4 重要：embedding 维度

- `nomic-embed-text` 的 embedding 维度是 **768**（已实测）。
- 因此 Milvus collection 的 `EMBEDDING_DIM` 必须是 **768**。
- 如果你换 embedding 模型，第一件事是确认维度，并 **全量重建 collection**。

## 3. 安装依赖（milvus-tools）

```bash
cd ~/Documents/milvus-tools
pnpm install
```

## 4. 快捷指令（Scripts）

所有脚本都在 `~/Documents/milvus-tools/package.json`。

### 4.1 连接与健康检查

```bash
cd ~/Documents/milvus-tools
pnpm run milvus:smoke
```

输出包括：Milvus 版本、健康状态、已有 collections。

### 4.2 初始化/建表（如果 collection 不存在）

```bash
cd ~/Documents/milvus-tools
EMBEDDING_DIM=768 pnpm run milvus:init
```

### 4.3 全量重建（推荐：更新文档后就用这个）

> 全量重建会 drop `ai_common_chunks`，然后按当前维度重建 schema + 索引 + load。

```bash
cd ~/Documents/milvus-tools
EMBEDDING_DIM=768 pnpm run milvus:rebuild
```

### 4.4 全量入库（切片 → 向量化 → 写入）

> 默认数据源：`/Users/webkubor/Documents/AI_Common`

```bash
cd ~/Documents/milvus-tools
EMBED_PROVIDER=ollama \
OLLAMA_MODEL=nomic-embed-text \
EMBEDDING_DIM=768 \
pnpm run milvus:ingest
```

只看切片数量、不写入（dry-run）：

```bash
cd ~/Documents/milvus-tools
pnpm run milvus:ingest -- --dry-run
```

### 4.5 语义检索测试（本地 embedding）

```bash
cd ~/Documents/milvus-tools
EMBED_PROVIDER=ollama \
OLLAMA_MODEL=nomic-embed-text \
EMBEDDING_DIM=768 \
pnpm run milvus:search -- "隐私 入库 排除"
```

## 5. 默认约定（你需要知道的“规则”）

### 5.1 Collection

- 默认 collection：`ai_common_chunks`
- 默认向量字段：`vector`

### 5.2 切片（Chunking）

- 以 Markdown 标题 `# / ## / ###` 切片
- 建议长度：`minChars=200`、`maxChars=1200`
- `chunk_id`：对 `(path + heading_path + index)` 做 sha1，保证稳定

### 5.3 字段写入

写入字段（用于后续检索注入）：
- `chunk_id`, `vector`, `content`, `path`, `title`, `section`, `doc_type`, `updated_at`

### 5.4 隐私边界

- 入库前请遵循 `~/Documents/AI_Common/privacy_excludes.md`
- 默认只扫描 `AI_Common` 目录下 `*.md`

## 6. 推荐工作流（最短闭环）

1. 修改 `~/Documents/AI_Common` 文档
2. 全量重建：`pnpm run milvus:rebuild`
3. 全量入库：`pnpm run milvus:ingest`
4. 用 `milvus:search` 或 Attu UI 验证检索效果

---

## 附：环境变量速查

- `MILVUS_ADDR`：默认 `127.0.0.1:19530`
- `MILVUS_COLLECTION`：默认 `ai_common_chunks`
- `AI_COMMON_ROOT`：默认 `/Users/webkubor/Documents/AI_Common`
- `EMBED_PROVIDER`：`ollama` / `mock`
- `OLLAMA_BASE_URL`：默认 `http://127.0.0.1:11434`
- `OLLAMA_MODEL`：默认 `nomic-embed-text`
- `EMBEDDING_DIM`：本机 Ollama 默认 `768`
- `TOPK`：搜索条数（默认 10）
- `BATCH_SIZE`：入库 batch（默认 64）
- `OLLAMA_CONCURRENCY`：embedding 并发（默认 4）
