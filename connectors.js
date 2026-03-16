/**
 * Cross-Channel Merge - 渠道数据连接器
 * 
 * 连接各渠道数据源，收集会话记录
 */

const fs = require('fs');
const path = require('path');

// 工作区目录
const WORKSPACE_DIR = 'C:\\Users\\Admin\\.openclaw\\workspace';
const SESSIONS_DIR = 'C:\\Users\\Admin\\.openclaw\\agents\\main\\sessions';

/**
 * WebChat 连接器
 */
class WebChatConnector {
  constructor() {
    this.name = 'webchat';
    this.sessionsDir = SESSIONS_DIR;
  }

  async connect() {
    console.log('🔌 Connecting to WebChat...');
    const exists = fs.existsSync(this.sessionsDir);
    console.log(`   Sessions Dir: ${exists ? '✅' : '❌'}`);
    return exists;
  }

  async getSessions(options = {}) {
    const sessions = [];
    
    try {
      if (fs.existsSync(this.sessionsDir)) {
        const files = fs.readdirSync(this.sessionsDir).filter(f => f.endsWith('.jsonl'));
        
        for (const file of files) {
          const filePath = path.join(this.sessionsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.type === 'message' && entry.message) {
                const msg = entry.message;
                if (msg.role === 'user' || msg.role === 'assistant') {
                  sessions.push({
                    id: `webchat-${file}-${sessions.length}`,
                    originalChannel: 'webchat',
                    originalSessionId: file,
                    timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : entry.timestamp || new Date().toISOString(),
                    role: msg.role,
                    content: { type: 'message', text: msg.content?.[0]?.text || msg.content || '' },
                    user: { id: 'webchat-user', channel: 'webchat' },
                    metadata: entry.metadata || {}
                  });
                }
              }
            } catch (e) { /* Skip invalid JSON */ }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  WebChat connector error: ${error.message}`);
    }
    
    console.log(`📥 WebChat: ${sessions.length} messages`);
    return sessions;
  }
}

/**
 * WhatsApp 连接器
 */
class WhatsAppConnector {
  constructor() {
    this.name = 'whatsapp';
    this.configPath = path.join(WORKSPACE_DIR, 'docs\\whatsapp-config.json');
    this.sessionsDir = SESSIONS_DIR;
  }

  async connect() {
    console.log('🔌 Connecting to WhatsApp...');
    const configExists = fs.existsSync(this.configPath);
    const sessionsExist = fs.existsSync(this.sessionsDir);
    console.log(`   Config: ${configExists ? '✅' : '❌'}, Sessions: ${sessionsExist ? '✅' : '❌'}`);
    return configExists && sessionsExist;
  }

  async getSessions(options = {}) {
    const sessions = [];
    
    try {
      if (fs.existsSync(this.sessionsDir)) {
        const files = fs.readdirSync(this.sessionsDir).filter(f => f.endsWith('.jsonl'));
        
        for (const file of files) {
          const filePath = path.join(this.sessionsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.type === 'message' && entry.message) {
                const msg = entry.message;
                // 检查 WhatsApp 渠道标记
                if (entry.metadata?.channel === 'whatsapp' || entry.metadata?.platform === 'whatsapp') {
                  sessions.push({
                    id: `whatsapp-${file}-${sessions.length}`,
                    originalChannel: 'whatsapp',
                    originalSessionId: file,
                    timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : entry.timestamp || new Date().toISOString(),
                    role: msg.role || 'user',
                    content: { type: 'message', text: msg.content?.[0]?.text || msg.content || '' },
                    user: { id: 'user-415473008', channel: 'whatsapp', phone: '+8613421515922' },
                    metadata: entry.metadata || {}
                  });
                }
              }
            } catch (e) { /* Skip invalid JSON */ }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  WhatsApp connector error: ${error.message}`);
    }
    
    console.log(`📥 WhatsApp: ${sessions.length} messages`);
    return sessions;
  }
}

/**
 * Telegram 连接器
 */
class TelegramConnector {
  constructor() {
    this.name = 'telegram';
    this.configPath = path.join(WORKSPACE_DIR, 'docs\\telegram-config.json');
  }
  async connect() { console.log('🔌 Connecting to Telegram...'); return fs.existsSync(this.configPath); }
  async getSessions() { console.log('📥 Telegram: 0 messages (API integration needed)'); return []; }
}

/**
 * Discord 连接器
 */
class DiscordConnector {
  constructor() {
    this.name = 'discord';
    this.configPath = path.join(WORKSPACE_DIR, 'docs\\discord-config.json');
  }
  async connect() { console.log('🔌 Connecting to Discord...'); return fs.existsSync(this.configPath); }
  async getSessions() { console.log('📥 Discord: 0 messages (API integration needed)'); return []; }
}

/**
 * Feishu 连接器
 */
class FeishuConnector {
  constructor() {
    this.name = 'feishu';
    this.configPath = path.join(WORKSPACE_DIR, 'docs\\feishu-config.json');
  }
  async connect() { console.log('🔌 Connecting to Feishu...'); return fs.existsSync(this.configPath); }
  async getSessions() { console.log('📥 Feishu: 0 messages (API integration needed)'); return []; }
}

/**
 * 连接器管理器
 */
class ConnectorManager {
  constructor() {
    this.connectors = {
      webchat: new WebChatConnector(),
      whatsapp: new WhatsAppConnector(),
      telegram: new TelegramConnector(),
      discord: new DiscordConnector(),
      feishu: new FeishuConnector()
    };
  }

  async connectAll(enabledChannels) {
    const results = {};
    for (const channel of enabledChannels) {
      const connector = this.connectors[channel];
      if (connector) results[channel] = await connector.connect();
    }
    return results;
  }

  async collectSessions(enabledChannels) {
    const allSessions = [];
    console.log('📥 Collecting sessions from channels...');
    
    for (const channel of enabledChannels) {
      const connector = this.connectors[channel];
      if (connector) {
        const sessions = await connector.getSessions();
        if (sessions && Array.isArray(sessions)) allSessions.push(...sessions);
      }
    }
    
    console.log(`📊 Total collected: ${allSessions.length} messages`);
    return allSessions;
  }

  getStatus() {
    const status = {};
    for (const [name, connector] of Object.entries(this.connectors)) {
      status[name] = { available: true, configExists: fs.existsSync(connector.configPath) };
    }
    return status;
  }
}

module.exports = { WebChatConnector, WhatsAppConnector, TelegramConnector, DiscordConnector, FeishuConnector, ConnectorManager };
