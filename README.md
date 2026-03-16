# 🔗 Cross-Channel Merge - 跨渠道聊天记录合并

> 打通飞书、Telegram、Discord、WhatsApp、WebChat 等渠道，实现统一记忆和上下文追踪

**版本：** 1.0.0  
**作者：** 小助的老大 (Geoff)  
**许可证：** MIT-0  
**EvoMap 兼容：** ✅ GEP-A2A Protocol

---

## 🎯 功能特性

### 核心功能
- ✅ **多渠道支持** - WebChat, WhatsApp, Telegram, Discord, 飞书
- ✅ **统一存储** - 标准化格式存储所有渠道消息
- ✅ **智能去重** - 基于语义相似度的重复检测
- ✅ **时间线合并** - 按时间戳排序的统一视图
- ✅ **用户身份映射** - 跨渠道用户身份识别
- ✅ **实时同步** - Webhook 支持实时消息同步
- ✅ **Web 查看器** - 美观的跨渠道消息查看界面

### 技术特性
- 📊 语义去重 (Jaccard 相似度)
- 🔗 用户身份映射 (手机号/邮箱匹配)
- 🌐 RESTful API (stats, messages, duplicates)
- 🖥️ Web Dashboard (自动刷新)
- ⚡ Webhook 服务器 (实时同步)
- 📦 Git 版本控制 (可选)

---

## 🚀 快速开始

### 安装

```bash
# 方式 1: 使用 ClawHub
clawhub install cross-channel-merge

# 方式 2: 手动克隆
git clone https://github.com/YOUR_USERNAME/cross-channel-merge.git
cp -r cross-channel-merge ~/.openclaw/workspace/skills/
```

### 初始化

```bash
# 初始化跨渠道目录
node skills/cross-channel-merge/index.js init
```

### 合并消息

```bash
# 执行合并
node skills/cross-channel-merge/index.js merge

# 查看状态
node skills/cross-channel-merge/index.js status

# 导出结果
node skills/cross-channel-merge/index.js export --output merged.jsonl
```

### 启动查看器

```bash
# 启动 Web 查看器 (端口 8420)
node skills/cross-channel-merge/index.js dashboard

# 访问：http://localhost:8420
```

### 启动 Webhook

```bash
# 启动 WhatsApp Webhook 服务器 (端口 8421)
node skills/whatsapp-webhook/server.js

# Webhook URL: http://localhost:8421/webhook
```

---

## 📁 文件结构

```
cross-channel-merge/
├── SKILL.md              # 技能文档
├── README.md             # 使用说明
├── index.js              # 主程序
├── connectors.js         # 渠道连接器
├── server.js             # Dashboard 服务器
├── dashboard.html        # Web 查看器界面
└── README.md             # 本文档

whatsapp-webhook/
├── server.js             # WhatsApp Webhook 服务器
└── README.md             # Webhook 使用说明

scripts/
├── test-whatsapp-webhook.ps1  # Webhook 测试脚本
└── whatsapp-sync.ps1          # 手动同步脚本

docs/
├── whatsapp-sync-config.md    # 同步配置指南
├── whatsapp-config.json       # WhatsApp 配置
├── user-mapping.json          # 用户身份映射
└── merge-config.json          # 合并配置

memory/cross-channel/
├── merged.jsonl               # 合并后的消息
├── duplicates.json            # 去重记录
├── user-mapping.json          # 用户映射
└── merge-config.json          # 合并配置
```

---

## 🔌 渠道连接器

### 已实现

| 渠道 | 状态 | 连接器 |
|------|------|--------|
| **WebChat** | ✅ 完成 | `WebChatConnector` |
| **WhatsApp** | ✅ 完成 | `WhatsAppConnector` |
| **Telegram** | ⏳ 待配置 | `TelegramConnector` |
| **Discord** | ⏳ 待配置 | `DiscordConnector` |
| **Feishu** | ⏳ 待配置 | `FeishuConnector` |

### 添加新渠道

```javascript
class YourChannelConnector {
  constructor() {
    this.name = 'yourchannel';
    this.configPath = 'path/to/config.json';
  }

  async connect() {
    // 连接逻辑
    return true;
  }

  async getSessions() {
    // 获取会话逻辑
    return sessions;
  }
}
```

---

## 📊 API 端点

### Dashboard Server (端口 8420)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | Web 查看器界面 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/messages` | GET | 获取所有消息 |
| `/api/duplicates` | GET | 获取去重记录 |

### Webhook Server (端口 8421)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/webhook` | POST | 接收 WhatsApp 消息 |
| `/health` | GET | 健康检查 |
| `/status` | GET | 服务器状态 |

---

## 🔧 配置说明

### 用户身份映射

文件：`memory/cross-channel/user-mapping.json`

```json
{
  "mappings": [
    {
      "unifiedUserId": "user-415473008",
      "name": "小助",
      "phone": "+8613421515922",
      "email": "415473008@qq.com",
      "channels": {
        "webchat": { "status": "connected" },
        "whatsapp": { "status": "connected", "phone": "+8613421515922" }
      }
    }
  ]
}
```

### 合并配置

文件：`memory/cross-channel/merge-config.json`

```json
{
  "similarityThreshold": 0.9,
  "priorityRules": ["timestamp", "confidence", "priority", "source"],
  "autoMerge": true,
  "mergeIntervalMinutes": 60,
  "channels": {
    "webchat": { "enabled": true, "priority": 1 },
    "whatsapp": { "enabled": true, "priority": 2 }
  }
}
```

---

## 🧪 测试

### 测试 WhatsApp Webhook

```powershell
# PowerShell
.\scripts\test-whatsapp-webhook.ps1 "测试消息"
```

### 测试合并功能

```bash
# 合并所有渠道
node skills/cross-channel-merge/index.js merge

# 查看状态
node skills/cross-channel-merge/index.js status
```

---

## 📈 EvoMap 集成

### 发布到 EvoMap

```bash
# 使用 GEP-A2A 协议发布
node skills/cross-channel-merge/publish-to-evomap.js
```

### EvoMap 资产信息

- **类型：** Capsule + Gene Bundle
- **协议：** GEP-A2A v1.0.0
- **类别：** optimize
- **信号：** cross-channel, merge, deduplication, unified-memory

---

## 🤝 贡献指南

### 如何贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发计划

- [ ] Telegram 连接器
- [ ] Discord 连接器
- [ ] 飞书连接器
- [ ] 实时消息推送
- [ ] 消息搜索功能
- [ ] 导出为 PDF/HTML
- [ ] 多语言支持

---

## 📝 更新日志

### v1.0.0 (2026-03-16)

- ✅ 初始版本
- ✅ WebChat 和 WhatsApp 支持
- ✅ 语义去重功能
- ✅ Web 查看器
- ✅ Webhook 实时同步
- ✅ 用户身份映射

---

## 📄 许可证

MIT-0 - 自由使用、修改和分发，无需署名

---

## 🙏 致谢

- OpenClaw 团队提供的基础框架
- EvoMap 社区的 GEP-A2A 协议
- 所有贡献者和测试用户

---

## 📞 联系方式

- **作者：** 小助的老大 (Geoff)
- **邮箱：** 415473008@qq.com
- **WhatsApp:** +8613421515922
- **GitHub:** @Geoffwong94

---

**让 AI 的记忆不再孤立，实现真正的跨渠道统一智能！** 🧠🔗
