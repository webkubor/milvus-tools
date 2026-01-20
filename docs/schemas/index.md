# Schema 预设

Milvus Tools 提供一套常用 Schema，覆盖文档、代码、图像、多语言、对话等场景。所有定义都在 `scripts/common/schemas.mjs` 中，你可以直接导入并使用，或者基于其克隆/扩展。

| 预设名称 | Collection 名称 | 向量维度 | 适用场景 |
|----------|-----------------|----------|----------|
| `rag` | `rag_documents` | 768 | 通用知识库、RAG 问答 |
| `simple` | `simple_text` | 768 | 最小化测试、快速验证 |
| `full_metadata` | `full_metadata` | 1536 | 丰富元数据、JSON 字段 |
| `code` | `code_snippets` | 768 | 代码片段搜索 |
| `image` | `image_search` | 512 | 图像向量/标签检索 |
| `multilingual` | `multilingual_docs` | 1024 | 多语言知识库 |
| `conversation` | `conversations` | 768 | 对话历史存储与检索 |
| `product` | `product_catalog` | 1536 | 商品推荐与目录 |

## 使用方式

```javascript
import { getPresetSchema, describeSchema } from '../../scripts/common/schemas.mjs'

const schema = getPresetSchema('rag')
console.log(schema.collectionName)
console.log(describeSchema(schema))
```

## 自定义 Schema

你可以通过 `createSchema` 构建自定义集合：

```javascript
import { createSchema, floatVectorField, varCharField } from '../../scripts/common/schemas.mjs'

const custom = createSchema({
  collectionName: 'ai_reports',
  dimension: 1024,
  customFields: [
    varCharField('title', 512),
    floatVectorField('vector', 1024),
    varCharField('summary', 4096)
  ],
  indexParams: { nlist: 1024 }
})
```

此外，可以使用 `cloneSchema` 在已有 Schema 上增加字段或调整索引：

```javascript
import { getPresetSchema, cloneSchema, varCharField } from '../../scripts/common/schemas.mjs'

const schema = cloneSchema(getPresetSchema('rag'), {
  collectionName: 'rag_with_meta',
  addFields: [
    varCharField('company', 256)
  ]
})
```
