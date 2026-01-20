import { resolve } from 'node:path'
import { homedir } from 'node:os'
import { existsSync, readFileSync } from 'node:fs'

/**
 * 配置加载器
 * 支持 JSON 配置文件 + 环境变量覆盖
 */
class ConfigLoader {
  constructor(configPath = null) {
    this.configPath = configPath || resolve(process.cwd(), 'config.json')
    this.config = this.load()
  }

  /**
   * 加载配置文件
   */
  load() {
    if (!existsSync(this.configPath)) {
      throw new Error(`配置文件不存在: ${this.configPath}`)
    }

    const content = readFileSync(this.configPath, 'utf-8')
    const config = JSON.parse(content)

    // 展开路径中的 ~ 为用户主目录
    this.expandPaths(config)

    return config
  }

  /**
   * 展开路径中的 ~ 为用户主目录
   */
  expandPaths(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/^~/, homedir())
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.expandPaths(obj[key])
      }
    }
  }

  /**
   * 获取配置值（支持环境变量覆盖）
   * 优先级: 环境变量 > 配置文件
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.')
    let value = this.config

    for (const key of keys) {
      if (value === undefined) return defaultValue
      value = value[key]
    }

    // 检查环境变量覆盖（驼峰转大写下划线）
    const envKey = this.pathToEnvKey(path)
    if (process.env[envKey] !== undefined) {
      return this.parseEnvValue(process.env[envKey])
    }

    return value
  }

  /**
   * 路径转环境变量键名
   * 例: milvus.address -> MILVUS_ADDR
   */
  pathToEnvKey(path) {
    return path
      .split('.')
      .join('_')
      .toUpperCase()
  }

  /**
   * 解析环境变量值
   */
  parseEnvValue(value) {
    // 尝试解析数字
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10)
    }
    // 尝试解析浮点数
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }
    // 尝试解析布尔值
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    return value
  }

  /**
   * 获取完整配置
   */
  getAll() {
    return { ...this.config }
  }

  /**
   * 获取 Milvus 配置
   */
  getMilvusConfig() {
    return {
      address: this.get('milvus.address'),
      collection: this.get('milvus.collection')
    }
  }

  /**
   * 获取数据源配置
   */
  getDataSourceConfig() {
    return {
      root: this.get('dataSource.root'),
      filePatterns: this.get('dataSource.filePatterns'),
      privacyExcludeFile: this.get('dataSource.privacyExcludeFile')
    }
  }

  /**
   * 获取 Embedding 配置
   */
  getEmbeddingConfig() {
    const provider = this.get('embedding.provider')

    if (provider === 'ollama') {
      return {
        provider: 'ollama',
        baseUrl: this.get('embedding.ollama.baseUrl'),
        model: this.get('embedding.ollama.model'),
        dimension: this.get('embedding.ollama.dimension'),
        concurrency: this.get('embedding.ollama.concurrency')
      }
    } else if (provider === 'openai') {
      return {
        provider: 'openai',
        apiKey: this.get('embedding.openai.apiKey'),
        model: this.get('embedding.openai.model'),
        dimension: this.get('embedding.openai.dimension'),
        baseUrl: this.get('embedding.openai.baseUrl')
      }
    }

    throw new Error(`不支持的 embedding provider: ${provider}`)
  }

  /**
   * 获取切片配置
   */
  getChunkingConfig() {
    return {
      minChars: this.get('chunking.minChars'),
      maxChars: this.get('chunking.maxChars'),
      headingDelimiters: this.get('chunking.headingDelimiters')
    }
  }

  /**
   * 获取搜索配置
   */
  getSearchConfig() {
    return {
      topK: this.get('search.topK'),
      metricType: this.get('search.metricType')
    }
  }

  /**
   * 获取入库配置
   */
  getIngestConfig() {
    return {
      batchSize: this.get('ingest.batchSize')
    }
  }

  /**
   * 获取索引配置
   */
  getIndexConfig() {
    return {
      type: this.get('index.type'),
      metricType: this.get('index.metricType'),
      params: this.get('index.params')
    }
  }

  /**
   * 获取 Docker 配置
   */
  getDockerConfig() {
    return {
      composePath: this.get('milvus.docker.composePath'),
      serviceName: this.get('milvus.docker.serviceName'),
      attuUrl: this.get('milvus.docker.attuUrl')
    }
  }
}

// 导出单例实例
export const config = new ConfigLoader()

// 同时导出类（用于测试）
export default ConfigLoader
