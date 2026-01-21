import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_ENTRIES = 30;
const ENTRY_SEPARATOR = '==================================================\n';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return path.join(LOG_DIR, `milvus-tools-${dateStr}.log`);
}

/**
 * 记录直观、可读的操作日志
 */
export async function logAction(action, details, level = 'INFO') {
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { hour12: false });
  
  let entry = `[${timeStr}] [${action}] [${level}]\n`;

  if (action === 'SEARCH') {
    entry += `🔍 查询词: ${details.query}\n`;
    if (details.expandedQuery !== details.query) {
      entry += `扩展词: ${details.expandedQuery}\n`;
    }
    entry += `📊 结果: 命中 ${details.resultsCount} 条 (TopK: ${details.topK})\n`;
    entry += `⏱️ 耗时: ${details.durationMs}ms\n`;
    if (details.topResults && details.topResults.length > 0) {
      entry += `📌 命中摘要:\n`;
      details.topResults.forEach((res, i) => {
        entry += `   ${i + 1}. [${res.score.toFixed(4)}] ${res.title} -> ${res.path}\n`;
      });
    }
  } else if (action === 'INGEST') {
    entry += `📥 入库完成\n`;
    entry += `📁 文件总数: ${details.filesCount}\n`;
    entry += `🧩 切片总数: ${details.chunksCount}\n`;
    entry += `🧠 模型: ${details.embedProvider} (维度: ${details.dim})\n`;
    entry += `📦 集合: ${details.collectionName}\n`;
  } else if (action === 'INIT' || action === 'REBUILD') {
    entry += `🛠️ 维护操作: ${action}\n`;
    entry += `📦 集合: ${details.collectionName}\n`;
    entry += `📐 维度: ${details.dim}\n`;
    entry += `状态: ${details.status || 'Success'}\n`;
  } else {
    entry += `详情: ${JSON.stringify(details, null, 2)}\n`;
  }
  
  entry += ENTRY_SEPARATOR;

  const logFile = getLogFilePath();

  try {
    let entries = [];
    if (fs.existsSync(logFile)) {
      const content = await fs.promises.readFile(logFile, 'utf8');
      entries = content.split(ENTRY_SEPARATOR).filter(e => e.trim() !== '');
    }

    entries.push(entry.replace(ENTRY_SEPARATOR, ''));

    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(entries.length - MAX_ENTRIES);
    }

    await fs.promises.writeFile(logFile, entries.join(ENTRY_SEPARATOR) + ENTRY_SEPARATOR, 'utf8');
  } catch (err) {
    console.error('写入日志失败:', err);
  }
}

export default logAction;
