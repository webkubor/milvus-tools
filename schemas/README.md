# Milvus Schema 预设

本目录包含 Milvus Collection 的预设 Schema 定义，帮助快速搭建向量数据库。

## 快速开始

### 使用预设 Schema

```javascript
import { getPresetSchema } from './schemas.mjs'

// 获取 RAG 文档 Schema
const schema = getPresetSchema('rag')
console.log(schema.collectionName)  // 'rag_documents'
console.log(schema.dimension)        // 768
```

### 创建自定义 Schema

```javascript
import { createSchema, varCharField, floatVectorField } from './schemas.mjs'

const customSchema = createSchema({
  collectionName: 'my_collection',
  dimension: 1024,
  customFields: [
    varCharField('document_id', 64),
    floatVectorField('vector', 1024),
    varCharField('content', 16384)
  ]
})
```

## 预设 Schema 列表

| 预设名称 | Collection 名称 | 维度 | 适用场景 |
|---------|----------------|------|---------|
| `rag` | `rag_documents` | 768 | 知识库、文档检索、RAG |
| `simple` | `simple_text` | 768 | 简单文本搜索、测试 |
| `full_metadata` | `full_metadata` | 1536 | 需要丰富元数据的场景 |
| `code` | `code_snippets` | 768 | 代码搜索、代码补全 |
| `image` | `image_search` | 512 | 图像检索、以图搜图 |
| `multilingual` | `multilingual_docs` | 1024 | 多语言知识库 |
| `conversation` | `conversations` | 768 | 对话系统、聊天记录 |
| `product` | `product_catalog` | 1536 | 电商、商品推荐 |

## Schema 字段类型

### 基础字段

| 类型 | 说明 | 限制 |
|-----|------|------|
| `Int64` | 64位整数 | -2^63 ~ 2^63-1 |
| `Bool` | 布尔值 | true/false |
| `VarChar` | 可变长字符串 | 需指定 max_length (1-65535) |
| `JSON` | JSON 对象 | 无大小限制 |

### 向量字段

| 类型 | 说明 | 维度范围 |
|-----|------|---------|
| `FloatVector` | 32位浮点向量 | 1-32768 |
| `Float16Vector` | 16位浮点向量 | 2-65535 |
| `BFloat16Vector` | BFloat16 向量 | 2-65535 |

## 索引类型

### FLAT

- **精确搜索**，无近似
- 适用于小规模数据（< 100K）
- 参数：无

### HNSW

- **高性能近似搜索**
- 适用于中大规模数据
- 参数：
  - `M`: 每个节点的连接数（16-64）
  - `efConstruction`: 构建时的搜索范围（100-500）

### IVF_FLAT

- **平衡性能和准确性**
- 适用于大规模数据（> 1M）
- 参数：
  - `nlist`: 聚类中心数量（1024-16384）

## 距离度量

| 度量方式 | 说明 | 适用场景 |
|---------|------|---------|
| `COSINE` | 余弦相似度 | 文本、语义检索 |
| `L2` | 欧几里得距离 | 图像、坐标数据 |
| `IP` | 内积 | OpenAI embeddings |

## Embedding 模型映射

常见 embedding 模型与 Schema 的推荐搭配：

| 模型 | 维度 | 推荐预设 | 距离度量 |
|-----|------|---------|---------|
| nomic-embed-text | 768 | `rag` | COSINE |
| text-embedding-3-small | 1536 | `full_metadata` | IP |
| text-embedding-3-large | 3072 | `rag`（需调整维度） | IP |
| text-embedding-ada-002 | 1536 | `rag` | COSINE |
| bge-large-zh | 1024 | `multilingual` | COSINE |
| jina-embeddings-v2-base-zh | 768 | `multilingual` | COSINE |

详细配置见 [config-examples.json](config-examples.json)

## 使用示例

### 示例 1: 基于预设创建并调整

```javascript
import { getPresetSchema, cloneSchema } from './schemas.mjs'

const baseSchema = getPresetSchema('rag')
const customSchema = cloneSchema(baseSchema, {
  collectionName: 'my_rag_docs',
  dimension: 1536,  // 适配 text-embedding-3-small
  addFields: [
    varCharField('author', 256),
    varCharField('tags', 512)
  ]
})
```

### 示例 2: 完全自定义

```javascript
import {
  createSchema,
  int64Field,
  floatVectorField,
  varCharField,
  jsonField
} from './schemas.mjs'

const schema = createSchema({
  collectionName: 'custom_collection',
  dimension: 1024,
  vectorType: 'FloatVector',
  metricType: 'COSINE',
  indexType: 'HNSW',
  customFields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    floatVectorField('vector', 1024),
    varCharField('content', 16384),
    varCharField('category', 128),
    jsonField('metadata')
  ],
  indexParams: {
    M: 16,
    efConstruction: 200
  }
})
```

### 示例 3: 运行示例代码

```bash
node examples/schema-usage.mjs
```

## API 文档

### 函数

#### `getPresetSchema(name: string): Schema`

获取预设 Schema。

**参数：**
- `name`: 预设名称（'rag', 'simple', 'full_metadata' 等）

**返回：** Schema 对象

#### `createSchema(options: SchemaOptions): Schema`

创建自定义 Schema。

**参数：**
- `collectionName`: Collection 名称
- `dimension`: 向量维度
- `vectorFieldName`: 向量字段名（默认 'vector'）
- `vectorType`: 向量类型（默认 'FloatVector'）
- `metricType`: 距离度量（默认 'COSINE'）
- `indexType`: 索引类型（默认 'HNSW'）
- `customFields`: 自定义字段数组
- `indexParams`: 索引参数

**返回：** Schema 对象

#### `cloneSchema(schema: Schema, modifications: SchemaModifications): Schema`

克隆 Schema 并修改部分字段。

**参数：**
- `schema`: 原始 Schema
- `modifications`: 修改选项
  - `collectionName`: 新名称
  - `dimension`: 新维度
  - `addFields`: 添加的字段
  - `index`: 索引修改

**返回：** 新的 Schema 对象

#### `describeSchema(schema: Schema): SchemaDescription`

获取 Schema 的详细描述（用于调试和文档生成）。

**参数：**
- `schema`: Schema 对象

**返回：** Schema 描述对象

## Schema 结构

```typescript
interface Schema {
  collectionName: string
  dimension: number
  fields: Field[]
  index: IndexConfig
}

interface Field {
  name: string
  data_type: 'Int64' | 'VarChar' | 'FloatVector' | 'Float16Vector' | 'BFloat16Vector' | 'Bool' | 'JSON'
  max_length?: number
  dim?: number
  is_primary_key?: boolean
  autoID?: boolean
}

interface IndexConfig {
  field_name: string
  index_name: string
  index_type: 'FLAT' | 'HNSW' | 'IVF_FLAT' | 'IVF_PQ' | 'IVF_SQ8'
  metric_type: 'L2' | 'IP' | 'COSINE'
  params: Record<string, number>
}
```

## 注意事项

1. **向量维度必须匹配 Embedding 模型**
   - 确保 Schema 中的 `dimension` 与 embedding 模型输出维度一致

2. **VarChar 需要指定 max_length**
   - Milvus 要求 VarChar 字段必须设置最大长度

3. **Schema 变更需要重建 Collection**
   - 修改 Schema 需要删除并重建 Collection

4. **索引类型选择**
   - 小数据量：FLAT（精确）
   - 中等数据量：HNSW（快速）
   - 大数据量：IVF_FLAT（平衡）

5. **JSON 字段需要 Milvus 2.3.0+**
   - 旧版本不支持 JSON 字段类型
