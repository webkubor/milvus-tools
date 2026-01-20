# API 参考

本节介绍 Milvus Tools 的核心 API 接口。

## 模块概览

| 模块 | 说明 | 文档 |
|-----|------|------|
| `Chunker` | 文档切片器 | [查看 →](/api/chunker) |
| `Embedding` | Embedding 提供商 | [查看 →](/api/embedding) |
| `Ingestor` | 数据入库器 | [查看 →](/api/ingestor) |
| `Searcher` | 向量搜索器 | [查看 →](/api/searcher) |
| `Collection` | Collection 管理 | [查看 →](/api/collection) |
| `Schema` | Schema 系统 | [查看 →](/api/schema) |

## 快速导入

```javascript
// Schema 相关
import {
  getPresetSchema,
  createSchema,
  cloneSchema,
  describeSchema,
  PRESET_SCHEMAS,
  varCharField,
  floatVectorField,
  int64Field,
  jsonField
} from './schemas.mjs'

// 配置加载器
import { config } from './config-loader.mjs'

// 切片器（待实现）
// import { Chunker } from './src/chunker/index.mjs'

// Embedding 提供商（待实现）
// import { OllamaEmbedding } from './src/embedding/ollama.mjs'
```

## 基础用法

### 使用预设 Schema

```javascript
import { getPresetSchema } from './schemas.mjs'

const schema = getPresetSchema('rag')
console.log(schema.collectionName)  // 'rag_documents'
console.log(schema.dimension)      // 768
```

### 创建自定义 Schema

```javascript
import { createSchema, varCharField, floatVectorField } from './schemas.mjs'

const schema = createSchema({
  collectionName: 'my_collection',
  dimension: 1024,
  customFields: [
    varCharField('document_id', 64),
    floatVectorField('vector', 1024),
    varCharField('content', 16384)
  ]
})
```

### 读取配置

```javascript
import { config } from './config-loader.mjs'

// 获取完整配置
const allConfig = config.getAll()

// 获取特定配置
const milvusAddr = config.get('milvus.address')

// 获取分组配置
const milvusConfig = config.getMilvusConfig()
const embeddingConfig = config.getEmbeddingConfig()
```

## 类型定义

### Schema

```typescript
interface Schema {
  collectionName: string
  dimension: number
  fields: Field[]
  index: IndexConfig
}
```

### Field

```typescript
interface Field {
  name: string
  data_type: 'Int64' | 'VarChar' | 'FloatVector' | 'Float16Vector' | 'BFloat16Vector' | 'Bool' | 'JSON'
  max_length?: number
  dim?: number
  is_primary_key?: boolean
  autoID?: boolean
}
```

### IndexConfig

```typescript
interface IndexConfig {
  field_name: string
  index_name: string
  index_type: 'FLAT' | 'HNSW' | 'IVF_FLAT' | 'IVF_PQ' | 'IVF_SQ8'
  metric_type: 'L2' | 'IP' | 'COSINE'
  params: Record<string, number>
}
```

## 待完成 API

以下模块正在开发中，敬请期待：

- [ ] `Chunker` - 智能文档切片器
- [ ] `EmbeddingProvider` - 统一 Embedding 接口
- [ ] `Ingestor` - 数据入库工具
- [ ] `Searcher` - 向量搜索工具
- [ ] `CollectionManager` - Collection 管理工具
