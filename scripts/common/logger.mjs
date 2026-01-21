import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOGS = 30;

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `milvus-tools-${dateStr}.log`);
}

/**
 * 记录操作日志 (按天轮转，保留最近 30 条)
 * @param {string} action - 操作名称 (e.g., 'SEARCH', 'INGEST', 'INIT')
 * @param {object|string} details - 操作详情
 * @param {string} level - 日志级别 ('INFO', 'ERROR', 'WARN')
 */
export async function logAction(action, details, level = 'INFO') {
  const timestamp = new Date().toISOString();
  
  // 统一转为单行 JSON 字符串，方便按行处理
  const detailObj = typeof details === 'string' ? { message: details } : details;
  const logEntryObj = {
    timestamp,
    level,
    action,
    details: detailObj
  };
  const logEntryLine = JSON.stringify(logEntryObj) + '\n';

  const logFile = getLogFilePath();

  try {
    let lines = [];
    if (fs.existsSync(logFile)) {
      const content = await fs.promises.readFile(logFile, 'utf8');
      lines = content.split('\n').filter(line => line.trim() !== '');
    }

    // 追加新日志
    lines.push(logEntryLine.trim());

    // 截断超出部分（保留最后 MAX_LOGS 条）
    if (lines.length > MAX_LOGS) {
      lines = lines.slice(lines.length - MAX_LOGS);
    }

    // 写回文件
    await fs.promises.writeFile(logFile, lines.join('\n') + '\n', 'utf8');

  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export default logAction;