/**
 * Cross-Channel Merge Dashboard Server
 * 
 * 提供跨渠道消息查看器的 Web 界面和数据 API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8420;
const WORKSPACE_DIR = 'C:\\Users\\Admin\\.openclaw\\workspace';
const MERGED_FILE = path.join(WORKSPACE_DIR, 'memory\\cross-channel\\merged.jsonl');
const DUPLICATES_FILE = path.join(WORKSPACE_DIR, 'memory\\cross-channel\\duplicates.json');
const DASHBOARD_FILE = path.join(WORKSPACE_DIR, 'skills\\cross-channel-merge\\dashboard.html');

// MIME 类型
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json; charset=utf-8'
};

// 读取合并文件
function readMergedMessages() {
  try {
    if (!fs.existsSync(MERGED_FILE)) {
      return [];
    }
    const content = fs.readFileSync(MERGED_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    return lines.map(l => JSON.parse(l));
  } catch (error) {
    console.error('Error reading merged file:', error.message);
    return [];
  }
}

// 读取去重文件
function readDuplicates() {
  try {
    if (!fs.existsSync(DUPLICATES_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DUPLICATES_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading duplicates file:', error.message);
    return [];
  }
}

// HTTP 服务器
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // API 路由
  if (req.url === '/api/messages' && req.method === 'GET') {
    const messages = readMergedMessages();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: messages.length, data: messages }, null, 2));
    return;
  }
  
  if (req.url === '/api/duplicates' && req.method === 'GET') {
    const duplicates = readDuplicates();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: duplicates.length, data: duplicates }, null, 2));
    return;
  }
  
  if (req.url === '/api/stats' && req.method === 'GET') {
    const messages = readMergedMessages();
    const duplicates = readDuplicates();
    
    const stats = {
      total: messages.length,
      byChannel: {},
      byRole: { user: 0, assistant: 0 },
      duplicates: duplicates.length,
      lastUpdated: new Date().toISOString()
    };
    
    messages.forEach(msg => {
      const channel = msg.originalChannel || 'unknown';
      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      stats.byRole[msg.role || 'user']++;
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, data: stats }, null, 2));
    return;
  }
  
  // 静态文件服务 (Dashboard HTML)
  if (req.url === '/' || req.url === '/index.html') {
    if (fs.existsSync(DASHBOARD_FILE)) {
      const content = fs.readFileSync(DASHBOARD_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Dashboard HTML not found. Please run: node index.js dashboard');
      return;
    }
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

// 启动服务器
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   跨渠道消息查看器 - Cross-Channel Message Viewer       ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║   Dashboard: http://localhost:' + PORT + '                   ║');
  console.log('║   API Stats: http://localhost:' + PORT + '/api/stats              ║');
  console.log('║   API Messages: http://localhost:' + PORT + '/api/messages      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║   支持渠道：WebChat, WhatsApp, Telegram, Discord, 飞书    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 显示统计数据
  const messages = readMergedMessages();
  const duplicates = readDuplicates();
  console.log(`📊 已加载 ${messages.length} 条消息，${duplicates.length} 条去重记录`);
  console.log('');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
