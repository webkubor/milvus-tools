/**
 * Milvus Collection Schema 预设定义
 *
 * 提供常见场景的预设 Schema，可直接使用或作为自定义的基础
 */

import { DataType } from '@zilliz/milvus2-sdk-node'

// ============================================
// 字段构建器
// ============================================

/**
 * 创建 Int64 字段
 */
export function int64Field(name, options = {}) {
  return {
    name,
    data_type: DataType.Int64,
    is_primary_key: options.is_primary_key || false,
    autoID: options.autoID || false
  }
}

/**
 * 创建 VarChar 字段
 */
export function varCharField(name, maxLength = 65535, options = {}) {
  return {
    name,
    data_type: DataType.VarChar,
    max_length: maxLength,
    ...options
  }
}

/**
 * 创建 FloatVector 字段
 */
export function floatVectorField(name, dim = 768) {
  return {
    name,
    data_type: DataType.FloatVector,
    dim
  }
}

/**
 * 创建 Float16Vector 字段
 */
export function float16VectorField(name, dim = 768) {
  return {
    name,
    data_type: DataType.Float16Vector,
    dim
  }
}

/**
 * 创建 BFloat16Vector 字段
 */
export function bFloat16VectorField(name, dim = 768) {
  return {
    name,
    data_type: DataType.BFloat16Vector,
    dim
  }
}

/**
 * 创建 Bool 字段
 */
export function boolField(name) {
  return {
    name,
    data_type: DataType.Bool
  }
}

/**
 * 创建 JSON 字段（Milvus 2.3.0+）
 */
export function jsonField(name) {
  return {
    name,
    data_type: DataType.JSON
  }
}

// ============================================
// 常用 Schema 组合
// ============================================

/**
 * RAG 文档 Schema（最常用）
 *
 * 适用于：知识库、文档检索、问答系统
 */
export const RAG_DOCUMENT_SCHEMA = {
  collectionName: 'rag_documents',
  dimension: 768,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('chunk_id', 128),
    floatVectorField('vector', 768),
    varCharField('content', 8192),
    varCharField('title', 512),
    varCharField('section', 512),
    varCharField('path', 1024),
    varCharField('doc_type', 64),
    int64Field('updated_at')
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_hnsw',
    index_type: 'HNSW',
    metric_type: 'COSINE',
    params: {
      M: 16,
      efConstruction: 200
    }
  }
}

/**
 * 简单文本 Schema（最小化）
 *
 * 适用于：简单文本搜索、测试环境
 */
export const SIMPLE_TEXT_SCHEMA = {
  collectionName: 'simple_text',
  dimension: 768,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    floatVectorField('vector', 768),
    varCharField('content', 16384)
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_flat',
    index_type: 'FLAT',
    metric_type: 'COSINE',
    params: {}
  }
}

/**
 * 完整元数据 Schema（带 JSON）
 *
 * 适用于：需要丰富元数据的场景，支持 JSON 字段存储复杂结构
 */
export const FULL_METADATA_SCHEMA = {
  collectionName: 'full_metadata',
  dimension: 1536,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('chunk_id', 128),
    floatVectorField('vector', 1536),
    varCharField('content', 16384),
    varCharField('title', 512),
    varCharField('author', 256),
    varCharField('category', 128),
    int64Field('created_at'),
    int64Field('updated_at'),
    boolField('is_published'),
    jsonField('metadata')  // 存储任意 JSON 结构
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_ivf',
    index_type: 'IVF_FLAT',
    metric_type: 'IP',
    params: {
      nlist: 1024
    }
  }
}

/**
 * 代码片段 Schema
 *
 * 适用于：代码搜索、代码补全、技术文档
 */
export const CODE_SNIPPET_SCHEMA = {
  collectionName: 'code_snippets',
  dimension: 768,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('snippet_id', 128),
    floatVectorField('vector', 768),
    varCharField('code', 8192),
    varCharField('language', 32),
    varCharField('function_name', 256),
    varCharField('file_path', 512),
    varCharField('project', 128),
    int64Field('line_start'),
    int64Field('line_end'),
    varCharField('docstring', 2048)
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_hnsw',
    index_type: 'HNSW',
    metric_type: 'COSINE',
    params: {
      M: 16,
      efConstruction: 200
    }
  }
}

/**
 * 图像检索 Schema
 *
 * 适用于：以图搜图、图像标注
 */
export const IMAGE_SEARCH_SCHEMA = {
  collectionName: 'image_search',
  dimension: 512,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    floatVectorField('vector', 512),
    varCharField('image_id', 128),
    varCharField('image_path', 1024),
    varCharField('image_format', 16),
    int64Field('width'),
    int64Field('height'),
    jsonField('labels'),  // 图像标签
    varCharField('caption', 2048)
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_hnsw',
    index_type: 'HNSW',
    metric_type: 'L2',
    params: {
      M: 32,
      efConstruction: 256
    }
  }
}

/**
 * 多语言文档 Schema
 *
 * 适用于：多语言知识库、国际化应用
 */
export const MULTILINGUAL_SCHEMA = {
  collectionName: 'multilingual_docs',
  dimension: 1024,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('chunk_id', 128),
    floatVectorField('vector', 1024),
    varCharField('content', 8192),
    varCharField('language', 8),
    varCharField('title', 512),
    varCharField('source_collection', 128),
    int64Field('updated_at'),
    boolField('is_translated'),
    varCharField('original_id', 128)
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_hnsw',
    index_type: 'HNSW',
    metric_type: 'COSINE',
    params: {
      M: 16,
      efConstruction: 200
    }
  }
}

/**
 * 对话历史 Schema
 *
 * 适用于：对话系统、聊天记录、上下文检索
 */
export const CONVERSATION_SCHEMA = {
  collectionName: 'conversations',
  dimension: 768,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('conversation_id', 128),
    varCharField('message_id', 128),
    floatVectorField('vector', 768),
    varCharField('role', 16),  // user/assistant/system
    varCharField('content', 4096),
    int64Field('timestamp'),
    int64Field('turn_order'),
    jsonField('metadata')
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_ivf',
    index_type: 'IVF_FLAT',
    metric_type: 'COSINE',
    params: {
      nlist: 512
    }
  }
}

/**
 * 产品目录 Schema
 *
 * 适用于：电商、商品推荐、产品搜索
 */
export const PRODUCT_CATALOG_SCHEMA = {
  collectionName: 'product_catalog',
  dimension: 1536,
  fields: [
    int64Field('id', { is_primary_key: true, autoID: true }),
    varCharField('product_id', 64),
    floatVectorField('vector', 1536),
    varCharField('name', 512),
    varCharField('description', 4096),
    varCharField('category', 256),
    varCharField('brand', 128),
    int64Field('price_cents'),
    boolField('in_stock'),
    int64Field('rating'),  // 1-100
    varCharField('tags', 1024),
    jsonField('attributes')
  ],
  index: {
    field_name: 'vector',
    index_name: 'vector_hnsw',
    index_type: 'HNSW',
    metric_type: 'IP',
    params: {
      M: 32,
      efConstruction: 256
    }
  }
}

// ============================================
// Schema 注册表
// ============================================

/**
 * 所有预设 Schema 的注册表
 */
export const PRESET_SCHEMAS = {
  rag: RAG_DOCUMENT_SCHEMA,
  simple: SIMPLE_TEXT_SCHEMA,
  full_metadata: FULL_METADATA_SCHEMA,
  code: CODE_SNIPPET_SCHEMA,
  image: IMAGE_SEARCH_SCHEMA,
  multilingual: MULTILINGUAL_SCHEMA,
  conversation: CONVERSATION_SCHEMA,
  product: PRODUCT_CATALOG_SCHEMA
}

/**
 * 根据名称获取预设 Schema
 */
export function getPresetSchema(name) {
  const schema = PRESET_SCHEMAS[name]
  if (!schema) {
    throw new Error(`未知预设 Schema: ${name}\n可用的预设: ${Object.keys(PRESET_SCHEMAS).join(', ')}`)
  }
  return schema
}

/**
 * 获取所有预设 Schema 名称
 */
export function listPresetSchemas() {
  return Object.keys(PRESET_SCHEMAS)
}

// ============================================
// Schema 构建工具
// ============================================

/**
 * 创建自定义 Schema
 */
export function createSchema(options) {
  const {
    collectionName,
    dimension,
    vectorFieldName = 'vector',
    vectorType = 'FloatVector',
    metricType = 'COSINE',
    indexType = 'HNSW',
    customFields = [],
    indexParams = {}
  } = options

  const fields = [
    int64Field('id', { is_primary_key: true, autoID: true }),
    ...customFields
  ]

  // 如果没有定义 vector 字段，自动添加
  if (!fields.some(f => f.name === vectorFieldName)) {
    if (vectorType === 'FloatVector') {
      fields.push(floatVectorField(vectorFieldName, dimension))
    } else if (vectorType === 'Float16Vector') {
      fields.push(float16VectorField(vectorFieldName, dimension))
    } else if (vectorType === 'BFloat16Vector') {
      fields.push(bFloat16VectorField(vectorFieldName, dimension))
    }
  }

  return {
    collectionName,
    dimension,
    fields,
    index: {
      field_name: vectorFieldName,
      index_name: `${vectorFieldName}_${indexType.toLowerCase()}`,
      index_type: indexType,
      metric_type: metricType,
      params: indexParams
    }
  }
}

/**
 * 克隆 Schema 并修改部分字段
 */
export function cloneSchema(schema, modifications = {}) {
  const cloned = JSON.parse(JSON.stringify(schema))

  // 更新 collectionName
  if (modifications.collectionName) {
    cloned.collectionName = modifications.collectionName
  }

  // 更新 dimension
  if (modifications.dimension !== undefined) {
    cloned.dimension = modifications.dimension
    // 同步更新向量字段维度
    cloned.fields = cloned.fields.map(field => {
      if (field.data_type === 'FloatVector' ||
          field.data_type === 'Float16Vector' ||
          field.data_type === 'BFloat16Vector') {
        return { ...field, dim: modifications.dimension }
      }
      return field
    })
  }

  // 添加新字段
  if (modifications.addFields) {
    cloned.fields.push(...modifications.addFields)
  }

  // 更新索引配置
  if (modifications.index) {
    cloned.index = { ...cloned.index, ...modifications.index }
  }

  return cloned
}

/**
 * 获取字段定义（用于调试和文档生成）
 */
export function describeSchema(schema) {
  return {
    name: schema.collectionName,
    dimension: schema.dimension,
    fieldCount: schema.fields.length,
    fields: schema.fields.map(f => ({
      name: f.name,
      type: f.data_type,
      primaryKey: f.is_primary_key,
      details: {
        max_length: f.max_length,
        dim: f.dim,
        autoID: f.autoID
      }
    })),
    index: schema.index
  }
}