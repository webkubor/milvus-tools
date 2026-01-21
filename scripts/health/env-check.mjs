import { execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import os from 'node:os';

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const checks = [];

function check(name, task) {
  checks.push({ name, task });
}

async function runChecks() {
  console.log(`${colors.cyan}${colors.bold}🔍 开始 Milvus Tools 环境自检 (Doctor)...${colors.reset}\n`);

  let allPassed = true;

  for (const { name, task } of checks) {
    process.stdout.write(`⏳ 检查 ${name}... `);
    try {
      const result = await task();
      process.stdout.write(`\r✅ ${colors.green}${name}${colors.reset}   \n`);
      if (result) console.log(`   └─ ${colors.cyan}${result}${colors.reset}`);
    } catch (error) {
      if (error.isWarning) {
        process.stdout.write(`\r⚠️  ${colors.yellow}${name}${colors.reset}   \n`);
        console.log(`   └─ ${colors.yellow}${error.hint}${colors.reset}`);
      } else {
        allPassed = false;
        process.stdout.write(`\r❌ ${colors.red}${name}${colors.reset}   \n`);
        console.log(`   └─ ${colors.yellow}失败原因: ${error.message}${colors.reset}`);
        if (error.hint) console.log(`   💡 ${colors.bold}建议: ${error.hint}${colors.reset}`);
      }
    }
  }

  console.log('\n--------------------------------------------------');
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}🎉 环境检查完成！关键服务均正常。${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  发现关键问题，请根据上述提示修复后再试。${colors.reset}`);
    process.exit(1);
  }
}

// === 定义检查项 ===

// 1. Node.js 版本
check('Node.js 环境', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major < 18) {
    const err = new Error(`当前版本 ${version} 过低`);
    err.hint = '请升级到 Node.js 18.0.0 或更高版本 (推荐使用 nvm install 18)';
    throw err;
  }
  return `版本: ${version}`;
});

// 2. 关键命令是否存在
['git', 'docker', 'ollama'].forEach(cmd => {
  check(`命令工具: ${cmd}`, () => {
    try {
      execSync(`command -v ${cmd}`, { stdio: 'ignore' });
      return '已安装';
    } catch {
      const err = new Error(`未找到命令 '${cmd}'`);
      if (cmd === 'ollama') err.hint = '请访问 https://ollama.com 下载安装';
      if (cmd === 'docker') err.hint = '请安装 Docker Desktop 并确保已启动';
      throw err;
    }
  });
});

// 3. 端口连通性检查工具
const checkPort = (host, port, serviceName) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve();
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      const err = new Error('连接超时');
      err.hint = `请检查 ${serviceName} 是否已启动 (端口 ${port})`;
      reject(err);
    });
    
    socket.on('error', (err) => {
      socket.destroy();
      const error = new Error(`连接失败 (${err.code})`);
      error.hint = `请检查 ${serviceName} 是否在 ${host}:${port} 上运行`;
      reject(error);
    });
    
    socket.connect(port, host);
  });
};

// 4. 服务检查
check('Milvus 服务 (19530)', async () => {
  const host = process.env.MILVUS_HOST || '127.0.0.1';
  await checkPort(host, 19530, 'Milvus Standalone');
  return '连接成功';
});

check('Ollama 服务 (11434)', async () => {
  const host = process.env.OLLAMA_HOST || '127.0.0.1';
  await checkPort(host, 11434, 'Ollama');
  return '连接成功';
});

// 5. Ollama 模型检查
check('Embedding 模型', () => {
  try {
    const modelName = process.env.OLLAMA_MODEL || 'nomic-embed-text';
    const output = execSync('ollama list', { encoding: 'utf-8' });
    if (!output.includes(modelName)) {
      const err = new Error(`未找到模型 '${modelName}'`);
      err.hint = `请运行: ollama pull ${modelName}`;
      throw err;
    }
    return `已加载: ${modelName}`;
  } catch (e) {
    if (e.message.includes('未找到模型')) throw e;
    return '跳过 (Ollama 未响应)';
  }
});

// 6. 目录检查
check('日志目录 (logs)', () => {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir);
      return '已自动创建';
    } catch {
      const err = new Error('无法自动创建 logs 目录');
      err.hint = '请检查当前用户对项目目录的写入权限';
      throw err;
    }
  }
  return '已存在';
});

check('知识库目录 (AI_Common)', () => {
  const defaultPath = path.join(os.homedir(), 'Documents', 'AI_Common');
  const targetPath = process.env.AI_COMMON_ROOT || defaultPath;
  
  if (!fs.existsSync(targetPath)) {
    const err = new Error('目录不存在');
    err.isWarning = true;
    err.hint = `未找到默认目录 ${targetPath}。\n      👉 如果您的文档在别处，请设置环境变量: export AI_COMMON_ROOT="/your/path"`;
    throw err;
  }
  return `已找到: ${targetPath}`;
});

// 执行
runChecks();