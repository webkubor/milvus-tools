import inquirer from 'inquirer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

async function getOllamaModels() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch (e) {
    return [];
  }
}

async function setup() {
  console.log('🚀 欢迎使用 Milvus Tools 交互式配置\n');

  // 读取现有配置
  let existingConfig = {};
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    existingConfig = JSON.parse(raw);
  } catch (e) {}

  // 预获取 Ollama 模型列表
  const installedModels = await getOllamaModels();
  const hasModels = installedModels.length > 0;

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'milvusAddress',
      message: 'Milvus 连接地址:',
      default: existingConfig.milvus?.address || '127.0.0.1:19530'
    },
    {
      type: 'input',
      name: 'collectionName',
      message: 'Collection 名称:',
      default: existingConfig.milvus?.collection || 'ai_common_chunks'
    },
    {
      type: 'list',
      name: 'embedProvider',
      message: '选择 Embedding 提供方:',
      choices: ['ollama', 'mock'],
      default: existingConfig.embedding?.provider || 'ollama'
    },
    // 场景 A: 发现了模型，提供列表选择
    {
      type: 'list',
      name: 'ollamaModelSelected',
      message: '选择已安装的 Ollama 模型:',
      choices: [...installedModels, new inquirer.Separator(), '手动输入其他模型'],
      when: (a) => a.embedProvider === 'ollama' && hasModels,
      default: existingConfig.embedding?.model
    },
    // 场景 B: 没发现模型，或用户选择手动输入
    {
      type: 'input',
      name: 'ollamaModelManual',
      message: '请输入 Ollama 模型名称:',
      default: existingConfig.embedding?.model || 'nomic-embed-text',
      when: (a) => a.embedProvider === 'ollama' && (!hasModels || a.ollamaModelSelected === '手动输入其他模型')
    },
    {
      type: 'number',
      name: 'embeddingDim',
      message: 'Embedding 维度 (nomic-embed-text: 768, bge-m3: 1024):',
      default: (a) => {
        const model = a.ollamaModelSelected || a.ollamaModelManual || '';
        if (model.includes('nomic')) return 768;
        if (model.includes('bge-m3')) return 1024;
        return existingConfig.embedding?.dim || 768;
      }
    },
    {
      type: 'input',
      name: 'aiCommonRoot',
      message: '知识库根目录 (AI_Common):',
      default: existingConfig.dataSource?.root || path.join(os.homedir(), 'Documents', 'AI_Common'),
      filter: (val) => val.replace(/^~/, os.homedir())
    }
  ]);

  const finalModel = answers.ollamaModelSelected === '手动输入其他模型' 
    ? answers.ollamaModelManual 
    : (answers.ollamaModelSelected || answers.ollamaModelManual);

  const config = {
    milvus: {
      address: answers.milvusAddress,
      collection: answers.collectionName
    },
    embedding: {
      provider: answers.embedProvider,
      model: finalModel,
      dim: answers.embeddingDim,
      baseUrl: 'http://127.0.0.1:11434'
    },
    dataSource: {
      root: answers.aiCommonRoot
    }
  };

  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

  console.log('\n✅ 配置已保存到 config.json');
  console.log('--------------------------------------------------');
  console.log(JSON.stringify(config, null, 2));
  console.log('--------------------------------------------------');
  console.log('💡 建议运行 pnpm run milvus:doctor 验证模型和端口状态。');
}

setup().catch(console.error);