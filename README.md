# 🤖 Milvus Tools

<p align="center">
  <img src="docs/public/milvus-logo.svg" width="120" alt="Milvus Logo" />
</p>

<p align="center">
  <a href="https://github.com/webkubor/milvus-tools/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/webkubor/milvus-tools?style=flat-square&color=blue" alt="license" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square&logo=node.js" alt="node version" />
  </a>
  <a href="https://milvus.io/">
    <img src="https://img.shields.io/badge/VectorDB-Milvus-0696D7?style=flat-square" alt="milvus" />
  </a>
  <a href="https://ollama.com/">
    <img src="https://img.shields.io/badge/Embedding-Ollama-white?style=flat-square&logo=ollama" alt="ollama" />
  </a>
</p>

---

**Milvus Tools** 是一个专为本地 AI 工作流设计的向量知识库工具箱。它能自动将你的本地文档（如 `AI_Common`）切片、向量化并同步到 **Milvus** 数据库，为 RAG（检索增强生成）提供强大的语义检索支持。

## 🌟 核心特性

- **🚀 零成本 Embedding**：默认集成本地 Ollama 引擎，无需 API Key。
- **📝 智能切片**：基于 Markdown 语义的自动切片策略，保留文档上下文。
- **📊 实时日志**：按天轮转的结构化操作日志，支持检索历史回溯。
- **🛠️ 维护简便**：支持一键全量重建索引，确保数据一致性。
- **🌐 完整生态**：配套可视化管理界面 (Attu) 与基于 VitePress 的技术文档。

---

## 🚀 快速开始

### 1. 环境准备
确保你的机器已安装以下服务：
- [Milvus Standalone](https://milvus.io/docs/install_standalone-docker.md) (Docker 运行)
- [Ollama](https://ollama.com/) (推荐模型: `nomic-embed-text`)

### 2. 安装
```bash
git clone https://github.com/webkubor/milvus-tools.git
cd milvus-tools
pnpm install
```

### 3. 数据同步
```bash
# 全量初始化/重建并入库
pnpm run milvus:rebuild
pnpm run milvus:ingest
```

---

## 📖 常用指令 (CLI)

| 命令 | 描述 | 示例 |
| :--- | :--- | :--- |
| `pnpm run milvus:search` | **语义检索** | `pnpm run milvus:search -- "如何规范 commit"` |
| `pnpm run milvus:ingest` | **文档入库** | `pnpm run milvus:ingest` |
| `pnpm run milvus:rebuild` | **全量重建** | ⚠️ 重建表结构与索引 |
| `pnpm run milvus:smoke` | **健康检查** | 查看数据库状态与版本 |
| `pnpm run docs:dev` | **预览文档** | 启动 VitePress 文档站点 |

---

## 📝 智能日志系统

日志存储在 `logs/` 目录，采用 **按天轮转** 策略，自动保留最近 30 条记录。

```text
[2026/1/21 15:36:00] [SEARCH] [INFO]
🔍 查询词: -- git 规范
📊 结果: 命中 10 条 (TopK: 10)
⏱️ 耗时: 262ms
📌 命中摘要:
   1. [0.6629] index.md -> AI_Common/index.md
```

---

## 🗄️ 数据库 Schema 字典

Collection: `ai_common_chunks`

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `chunk_id` | VarChar | 切片 SHA1 唯一标识 |
| `vector` | FloatVector(768) | 核心特征向量 |
| `content` | VarChar | Markdown 文本片段 |
| `path` | VarChar | 源文件相对路径 |
| `section` | VarChar | Markdown 章节标题 |
| `doc_type` | VarChar | 标签 (doc/rules/extension) |

---

## 🤝 参与贡献

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 开源协议

本项目基于 [ISC License](LICENSE) 协议开源。
