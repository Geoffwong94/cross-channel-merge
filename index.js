/**
 * Cross-Channel Merge — 跨渠道聊天记录合并
 * 
 * 支持飞书、Telegram、Discord、WhatsApp、WebChat 等多渠道会话统一存储
 */

const fs = require('fs');
const path = require('path');
const { ConnectorManager } = require('./connectors');

// 配置
const CONFIG = {
  workspaceDir: 'C:\\Users\\Admin\\.openclaw\\workspace',
  memoryDir: 'C:\\Users\\Admin\\.openclaw\\workspace\\memory',
  crossChannelDir: 'C:\\Users\\Admin\\.openclaw\\workspace\\memory\\cross-channel',
  similarityThreshold: 0.9,
  channels: ['feishu', 'telegram', 'discord', 'whatsapp', 'webchat']
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 初始化跨渠道目录
function initCrossChannelDir() {
  ensureDir(CONFIG.crossChannelDir);
  
  // 创建默认配置文件
  const userMappingPath = path.join(CONFIG.crossChannelDir, 'user-mapping.json');
  if (!fs.existsSync(userMappingPath)) {
    fs.writeFileSync(userMappingPath, JSON.stringify({
      mappings: [],
      lastUpdated: new Date().toISOString()
    }, null, 2));
  }
  
  const mergeConfigPath = path.join(CONFIG.crossChannelDir, 'merge-config.json');
  if (!fs.existsSync(mergeConfigPath)) {
    fs.writeFileSync(mergeConfigPath, JSON.stringify({
      similarityThreshold: CONFIG.similarityThreshold,
      priorityRules: ['timestamp', 'confidence', 'priority', 'source'],
      outputFormat: 'jsonl',
      gitVersioning: false,
      autoMerge: true,
      mergeIntervalMinutes: 60
    }, null, 2));
  }
  
  console.log('✅ Cross-channel directory initialized');
}

// 简单的语义相似度计算 (基于字符重叠)
function calculateSimilarity(text1, text2) {
  const s1 = (text1 || '').toString().toLowerCase().replace(/\s+/g, '');
  const s2 = (text2 || '').toString().toLowerCase().replace(/\s+/g, '');
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // 简单 Jaccard 相似度
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// 检测重复消息
function detectDuplicates(messages) {
  const duplicates = [];
  
  for (let i = 0; i < messages.length; i++) {
    for (let j = i + 1; j < messages.length; j++) {
      const msg1 = messages[i];
      const msg2 = messages[j];
      
      const similarity = calculateSimilarity(
        msg1.content?.text || '',
        msg2.content?.text || ''
      );
      
      if (similarity >= CONFIG.similarityThreshold) {
        duplicates.push({
          original: msg1.id,
          duplicate: msg2.id,
          similarity: similarity,
          channels: [msg1.originalChannel, msg2.originalChannel]
        });
      }
    }
  }
  
  return duplicates;
}

// 合并多渠道消息
function mergeMessages(messages) {
  // 1. 按时间戳排序
  const sorted = messages.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // 2. 检测重复
  const duplicates = detectDuplicates(sorted);
  
  // 3. 标记重复
  const duplicateIds = new Set(duplicates.map(d => d.duplicate));
  const merged = sorted.filter(msg => !duplicateIds.has(msg.id));
  
  // 4. 添加重复标记
  merged.forEach(msg => {
    const msgDuplicates = duplicates.filter(d => d.original === msg.id);
    if (msgDuplicates.length > 0) {
      msg.duplicates = msgDuplicates.map(d => d.duplicate);
    }
  });
  
  return {
    merged,
    duplicates,
    totalOriginal: messages.length,
    totalMerged: merged.length,
    duplicatesRemoved: duplicates.length
  };
}

// 从各渠道收集会话
async function collectChannelSessions() {
  // 加载配置
  const configPath = path.join(CONFIG.crossChannelDir, 'merge-config.json');
  let config = { channels: CONFIG.channels };
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  const enabledChannels = Object.keys(config.channels || {}).filter(c => config.channels[c].enabled !== false);
  
  // 使用连接器收集
  const manager = new ConnectorManager();
  const sessions = await manager.collectSessions(enabledChannels);
  
  return sessions || [];
}

// 执行合并
async function runMerge(options = {}) {
  console.log('🔄 Starting cross-channel merge...');
  console.log(`   Channels: ${options.channels || CONFIG.channels.join(', ')}`);
  console.log(`   Since: ${options.since || 'all time'}`);
  
  // 1. 收集会话
  const sessions = await collectChannelSessions();
  console.log(`📊 Collected ${sessions.length} messages`);
  
  if (sessions.length === 0) {
    console.log('ℹ️  No messages to merge');
    return { merged: [], duplicates: [] };
  }
  
  // 2. 合并消息
  const result = mergeMessages(sessions);
  console.log(`✅ Merged ${result.totalMerged} messages (removed ${result.duplicatesRemoved} duplicates)`);
  
  // 3. 保存合并结果
  const outputPath = path.join(CONFIG.crossChannelDir, 'merged.jsonl');
  const outputContent = result.merged.map(m => JSON.stringify(m)).join('\n');
  fs.writeFileSync(outputPath, outputContent, 'utf8');
  console.log(`💾 Saved to ${outputPath}`);
  
  // 4. 保存去重记录
  const duplicatesPath = path.join(CONFIG.crossChannelDir, 'duplicates.json');
  fs.writeFileSync(duplicatesPath, JSON.stringify(result.duplicates, null, 2), 'utf8');
  console.log(`💾 Saved duplicates to ${duplicatesPath}`);
  
  return result;
}

// 显示状态
function showStatus() {
  console.log('📊 Cross-Channel Merge Status');
  console.log('─────────────────────────────');
  
  const mergedPath = path.join(CONFIG.crossChannelDir, 'merged.jsonl');
  if (fs.existsSync(mergedPath)) {
    const content = fs.readFileSync(mergedPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`📁 Merged messages: ${lines.length}`);
  } else {
    console.log('📁 No merged messages yet');
  }
  
  const duplicatesPath = path.join(CONFIG.crossChannelDir, 'duplicates.json');
  if (fs.existsSync(duplicatesPath)) {
    const duplicates = JSON.parse(fs.readFileSync(duplicatesPath, 'utf8'));
    console.log(`🔄 Duplicates detected: ${duplicates.length}`);
  }
  
  console.log('─────────────────────────────');
}

// 导出合并结果
function exportMerged(options = {}) {
  const outputPath = options.output || 'merged-export.jsonl';
  const mergedPath = path.join(CONFIG.crossChannelDir, 'merged.jsonl');
  
  if (!fs.existsSync(mergedPath)) {
    console.log('❌ No merged data found. Run merge first.');
    return;
  }
  
  const content = fs.readFileSync(mergedPath, 'utf8');
  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`✅ Exported to ${outputPath}`);
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  console.log('🔗 Cross-Channel Merge Tool');
  console.log('');
  
  switch (command) {
    case 'init':
      initCrossChannelDir();
      break;
      
    case 'merge':
      initCrossChannelDir();
      runMerge().catch(console.error);
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'connectors':
      const mgr = new ConnectorManager();
      console.log('🔌 Connector Status:');
      console.log(JSON.stringify(mgr.getStatus(), null, 2));
      break;
      
    case 'export':
      const outputIndex = args.indexOf('--output');
      const output = outputIndex > -1 ? args[outputIndex + 1] : 'merged-export.jsonl';
      exportMerged({ output });
      break;
      
    case 'dashboard':
    case 'view':
      console.log('🚀 Starting Dashboard Server...');
      console.log('   Run: node skills/cross-channel-merge/server.js');
      console.log('');
      require('child_process').spawn('node', ['skills/cross-channel-merge/server.js'], {
        stdio: 'inherit',
        shell: true
      });
      break;
      
    case 'help':
    default:
      console.log('Usage:');
      console.log('  node index.js init       - Initialize cross-channel directory');
      console.log('  node index.js merge      - Merge messages from all channels');
      console.log('  node index.js status     - Show merge status');
      console.log('  node index.js export     - Export merged messages');
      console.log('  node index.js dashboard  - Start web dashboard viewer');
      console.log('  node index.js view       - Same as dashboard');
      console.log('  node index.js help       - Show this help');
      break;
  }
}

// 导出函数供其他模块使用
module.exports = {
  mergeMessages,
  detectDuplicates,
  calculateSimilarity,
  runMerge,
  showStatus,
  exportMerged,
  initCrossChannelDir
};

// 运行主程序
if (require.main === module) {
  main();
}
