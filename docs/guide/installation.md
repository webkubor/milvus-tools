# 安装指南

本文补充快速开始中的安装部分，整理了本地环境所需的组件。所有命令均在 `milvus-tools` 项目目录下执行。

1. 克隆仓库并安装依赖：

```bash
git clone https://github.com/webkubor/milvus-tools.git
cd milvus-tools
pnpm install
```

2. 启动 Milvus（推荐 standalone）：

```bash
mkdir -p ~/Documents/milvus
cd ~/Documents/milvus
curl -O https://github.com/milvus-io/milvus/releases/download/v2.6.1/milvus-standalone-docker-compose.yml
docker compose up -d
```

3. 启动常用 embedding：

```bash
brew install ollama
brew services start ollama
ollama pull nomic-embed-text
```

更多背景请参考 [快速开始](/guide/getting-started)。
