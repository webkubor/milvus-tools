import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import { config } from '../common/config-loader.mjs'

const milvusConfig = config.getMilvusConfig()

const client = new MilvusClient({ address: milvusConfig.address })

const version = await client.getVersion()
console.log('Milvus version:', version)

const health = await client.checkHealth()
console.log('Milvus health:', health)

const collections = await client.showCollections()
console.log('Collections:', collections?.data?.map((c) => c.name) ?? collections)
