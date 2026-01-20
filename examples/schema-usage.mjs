/**
 * Schema 使用示例
 *
 * 演示如何使用预设 Schema 和创建自定义 Schema
 */

import { getPresetSchema, createSchema, cloneSchema, describeSchema } from '../schemas.mjs'
import { varCharField, floatVectorField, jsonField } from '../schemas.mjs'

// ============================================
// 示例 1: 使用预设 Schema
// ============================================

console.log('\n=== 示例 1: 使用预设 RAG Schema ===')

const ragSchema = getPresetSchema('rag')
console.log('Collection 名称:', ragSchema.collectionName)
console.log('向量维度:', ragSchema.dimension)
console.log('字段数量:', ragSchema.fields.length)
console.log('\n字段列表:')
ragSchema.fields.forEach(f => console.log(`  - ${f.name}: ${f.data_type}`))

// ============================================
// 示例 2: 创建自定义 Schema
// ============================================

console.log('\n=== 示例 2: 创建自定义 Schema ===')

const customSchema = createSchema({
  collectionName: 'my_custom_collection',
  dimension: 1024,
  vectorFieldName: 'embedding',
  vectorType: 'FloatVector',
  metricType: 'COSINE',
  indexType: 'HNSW',
  customFields: [
    varCharField('document_id', 64),
    floatVectorField('embedding', 1024),
    varCharField('text', 16384),
    varCharField('category', 128),
    jsonField('extra_data')
  ],
  indexParams: {
    M: 32,
    efConstruction: 256
  }
})

console.log('自定义 Schema 已创建:', customSchema.collectionName)

// ============================================
// 示例 3: 基于预设 Schema 克隆并修改
// ============================================

console.log('\n=== 示例 3: 克隆并修改 Schema ===')

const modifiedSchema = cloneSchema(PRESET_SCHEMAS.rag, {
  collectionName: 'extended_rag_docs',
  dimension: 1536,
  addFields: [
    varCharField('author', 256),
    varCharField('tags', 512)
  ],
  index: {
    index_type: 'IVF_FLAT',
    params: { nlist: 1024 }
  }
})

console.log('修改后的 Collection:', modifiedSchema.collectionName)
console.log('新的向量维度:', modifiedSchema.dimension)
console.log('字段数量:', modifiedSchema.fields.length)

// ============================================
// 示例 4: 使用不同预设
// ============================================

console.log('\n=== 示例 4: 其他预设 Schema ===')

const schemas = ['simple', 'code', 'image', 'multilingual', 'conversation', 'product']

schemas.forEach(name => {
  const schema = getPresetSchema(name)
  console.log(`\n${name}:`)
  console.log(`  Collection: ${schema.collectionName}`)
  console.log(`  维度: ${schema.dimension}`)
  console.log(`  字段数: ${schema.fields.length}`)
  console.log(`  索引: ${schema.index.index_type}`)
})

// ============================================
// 示例 5: 生成 Schema 文档
// ============================================

console.log('\n=== 示例 5: Schema 详细描述 ===')

const fullDescription = describeSchema(PRESET_SCHEMAS.full_metadata)
console.log(JSON.stringify(fullDescription, null, 2))

// ============================================
// 示例 6: 匹配 Embedding 模型
// ============================================

console.log('\n=== 示例 6: Embedding 模型对应 ===')

const embeddingModels = {
  'nomic-embed-text': { dim: 768, schema: 'rag' },
  'text-embedding-3-small': { dim: 1536, schema: 'full_metadata' },
  'text-embedding-3-large': { dim: 3072, schema: 'rag' },  // 需要修改维度
  'claude-embedding': { dim: 768, schema: 'simple' }
}

for (const [model, info] of Object.entries(embeddingModels)) {
  console.log(`\n模型: ${model}`)
  console.log(`  维度: ${info.dim}`)

  const schema = getPresetSchema(info.schema)
  if (schema.dimension === info.dim) {
    console.log(`  推荐使用: ${schema.collectionName} (维度匹配)`)
  } else {
    const adjusted = cloneSchema(schema, { dimension: info.dim })
    console.log(`  推荐使用: ${adjusted.collectionName} (调整维度: ${schema.dimension} → ${info.dim})`)
  }
}