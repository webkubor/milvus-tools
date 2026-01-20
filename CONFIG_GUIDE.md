# 配置指南

本项目使用统一的配置文件 `config.json` 管理所有外部依赖和配置项。

## 配置文件结构

### 1. Milvus 配置

```json
{
  "milvus": {
    "address": "127.0.0.1:19530",        // Milvus 服务地址
    "collection": "ai_common_chunks",   // 默认 Collection 名称
    "docker": {
      "composePath": "~/Documents/milvus",    // Docker Compose 文件目录
      "serviceName": "milvus-standalone",     // 服务名称
      "attuUrl": "http://127.0.0.1:8000"     // Attu UI 地址
    }
  }
}
```

### 2. 数据源配置

```json
{
  "dataSource": {
    "root": "~/Documents/AI_Common",        // 文档根目录
    "filePatterns": ["*.md"],               // 文件匹配模式
    "privacyExcludeFile": "privacy_excludes.md" // 隐私排除规则文件
  }
}
```

### 3. Embedding 配置

支持两种 Provider：**Ollama**（本地）和 **OpenAI**（云端）。

#### Ollama 配置（默认，免费）

```json
{
  "embedding": {
    "provider": "ollama",
    "ollama": {
      "baseUrl": "http://127.0.0.1:11434",
      "model": "nomic-embed-text",
      "dimension": 768,
      "concurrency": 4
    }
  }
}
```

#### OpenAI 配置（付费）

```json
{
  "embedding": {
    "provider": "openai",
    "openai": {
      "apiKey": "sk-xxx",                    // OpenAI API Key
      "model": "text-embedding-3-small",
      "dimension": 1536,
      "baseUrl": "https://api.openai.com/v1"
    }
  }
}
```

### 4. 文档切片配置

```json
{
  "chunking": {
    "minChars": 200,            // 最小字符数
    "maxChars": 1200,           // 最大字符数
    "headingDelimiters": ["#", "##", "###"]  // 标题分隔符
  }
}
```

### 5. 搜索配置

```json
{
  "search": {
    "topK": 10,             // 返回结果数量
    "metricType": "COSINE"  // 相似度度量方式
  }
}
```

### 6. 入库配置

```json
{
  "ingest": {
    "batchSize": 64    // 批处理大小
  }
}
```

### 7. 索引配置

```json
{
  "index": {
    "type": "HNSW",
    "metricType": "COSINE",
    "params": {
      "M": 16,
      "efConstruction": 200
    }
  }
}
```

## 环境变量覆盖

配置文件中的任何值都可以通过环境变量覆盖，优先级高于配置文件。

### 环境变量命名规则

将配置路径转为大写下划线格式：

| 配置路径 | 环境变量名 |
|---------|-----------|
| `milvus.address` | `MILVUS_ADDR` |
| `embedding.ollama.model` | `EMBEDDING_OLLAMA_MODEL` |
| `dataSource.root` | `DATASOURCE_ROOT` |

### 使用示例

```bash
# 临时使用不同的 Milvus 地址
MILVUS_ADDR=192.168.1.100:19530 pnpm run milvus:smoke

# 临时使用不同的 embedding 模型
EMBEDDING_PROVIDER=openai \
EMBEDDING_OPENAI_API_KEY=sk-xxx \
pnpm run milvus:ingest

# 临时修改数据源目录
DATASOURCE_ROOT=/path/to/docs \
pnpm run milvus:ingest
```

## 路径展开

配置文件中的路径支持 `~` 展开，会自动替换为用户主目录：

```json
{
  "dataSource": {
    "root": "~/Documents/AI_Common"  // 会自动展开为 /Users/username/Documents/AI_Common
  }
}
```

## 代码中使用配置

```javascript
import { config } from './scripts/common/config-loader.mjs'

// 获取完整配置
const allConfig = config.getAll()

// 获取特定路径的配置
const address = config.get('milvus.address')

// 获取分组配置
const milvusConfig = config.getMilvusConfig()
const embeddingConfig = config.getEmbeddingConfig()
```

## 配置优先级

1. **环境变量**（最高优先级）
2. **config.json**（默认配置）
3. **代码中的默认值**（最低优先级）

## 常见配置场景

### 场景 1：切换到 OpenAI Embedding

```json
{
  "embedding": {
    "provider": "openai",
    "openai": {
      "apiKey": "sk-xxxxxxxxxxxxxxxx",
      "model": "text-embedding-3-small",
      "dimension": 1536
    }
  }
}
```

### 场景 2：使用 Milvus 集群

```json
{
  "milvus": {
    "address": "cluster.example.com:19530",
    "collection": "ai_common_chunks"
  }
}
```

### 场景 3：调整切片参数

```json
{
  "chunking": {
    "minChars": 300,
    "maxChars": 1500
  }
}
```

### 场景 4：修改数据源

```json
{
  "dataSource": {
    "root": "/path/to/your/docs",
    "filePatterns": ["*.md", "*.txt"]
  }
}
```

## 验证配置

运行 smoke test 验证配置是否正确：

```bash
pnpm run milvus:smoke
```

如果配置正确，你会看到：

```
Milvus version: 2.6.x
Milvus health: true
Collections: ['ai_common_chunks']
```
