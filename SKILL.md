---
name: cross-channel-merge
description: 跨渠道聊天记录合并/整合技能。支持飞书、Telegram、Discord、WhatsApp、WebChat 等多渠道会话统一存储、去重、合并和查询。使用标准化格式、时间戳排序、语义去重和 Git 版本控制。
metadata:
  openclaw:
    emoji: 🔗
    requires:
      bins: ["git"]
    install:
      - id: git
        kind: winget
        package: "Git.Git"
        label: "Install Git"
---

# Cross-Channel Merge — 跨渠道聊天记录合并

> 打通飞书、Telegram、Discord、WhatsApp、WebChat 等渠道，实现统一记忆和上下文追踪

## 问题

当前 OpenClaw 支持多种聊天渠道，但存在以下问题：

- **知识孤岛** — 各渠道聊天记录分开存储，彼此不互通
- **重复学习** — 用户在不同渠道问相同问题，Agent 每次都重新回答
- **上下文丢失** — 无法追踪跨渠道的连续对话
- **记忆冲突** — 不同渠道的信息可能矛盾

## 解决方案

### 1. 标准化记忆格式

```json
{
  "schema": "openclaw.memory.cross-channel.v1",
  "mergedAt": "2026-03-16T08:00:00Z",
  "channels": ["feishu", "telegram", "discord"],
  "entries": [
    {
      "id": "mem-cc-001",
      "originalChannel": "feishu",
      "originalSessionId": "99070df9-ea1f-4dfe-929e-461cc0f900ec",
      "timestamp": "2026-03-16T08:00:00Z",
      "user": {
        "id": "user-415473008",
        "channels": {
          "feishu": "ou_xxx",
          "telegram": "415473008",
          "discord": "user-xxx"
        }
      },
      "content": {
        "type": "fact",
        "text": "用户需要配置阿里巴巴国际站自动化",
        "priority": "P0",
        "confidence": 1.0,
        "tags": ["alibaba", "automation", "setup"]
      },
      "merged": true,
      "duplicates": ["telegram-session-xxx"]
    }
  ]
}
```

### 2. 用户身份映射

```json
{
  "unifiedUserId": "user-415473008",
  "channelAccounts": {
    "feishu": {
      "userId": "ou_xxx",
      "phone": "13421515922",
      "email": "415473008@qq.com"
    },
    "telegram": {
      "userId": "415473008",
      "phone": "+8613421515922"
    },
    "discord": {
      "userId": "user-xxx",
      "email": "415473008@qq.com"
    },
    "whatsapp": {
      "phone": "+8613421515922"
    }
  },
  "linkedAt": "2026-03-16T08:00:00Z"
}
```

**身份匹配规则：**
1. **手机号匹配** — 最可靠
2. **邮箱匹配** — 次可靠
3. **用户名匹配** — 需要人工确认
4. **行为模式** — ML 辅助识别

### 3. 会话合并流程

```
1. 收集各渠道会话
   ↓
2. 标准化格式 (统一 schema)
   ↓
3. 用户身份映射 (匹配同一用户)
   ↓
4. 时间戳排序 (按时间线排列)
   ↓
5. 语义去重 (检测重复内容)
   ↓
6. 冲突解决 (优先级规则)
   ↓
7. 生成合并记录
   ↓
8. Git 版本控制 (可选)
```

### 4. 冲突解决策略

**优先级规则：**
```yaml
rules:
  - timestamp: latest    # 最新优先
  - confidence: highest  # 高置信度优先
  - priority: P0 > P1 > P2
  - source: user-input > agent-inferred
  - channel:
    - feishu (工作渠道，优先级高)
    - telegram
    - discord
    - whatsapp
    - webchat
```

**合并策略：**
```javascript
function mergeMessages(msg1, msg2) {
  // 1. 检查是否重复 (语义相似度)
  if (semanticSimilarity(msg1, msg2) > 0.9) {
    return keepBetterOne(msg1, msg2);
  }
  
  // 2. 按时间线排序
  if (msg1.timestamp > msg2.timestamp) {
    return [msg2, msg1]; // 旧的在前
  }
  
  // 3. 保留两者 (互补信息)
  return [msg1, msg2];
}
```

### 5. 语义去重

使用本地 embeddings 模型检测重复：

```bash
# 安装 Ollama (可选，用于语义去重)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:3b
```

**去重逻辑：**
```javascript
// 计算语义相似度
const similarity = cosineSimilarity(
  embed(msg1.content),
  embed(msg2.content)
);

// 相似度 > 0.9 视为重复
if (similarity > 0.9) {
  markAsDuplicate(msg2, msg1);
}
```

## 使用方式

### 命令行模式

```bash
# 合并所有渠道的会话
node skills/cross-channel-merge/index.js merge

# 指定渠道合并
node skills/cross-channel-merge/index.js merge --channels feishu,telegram

# 查看合并状态
node skills/cross-channel-merge/index.js status

# 导出合并记录
node skills/cross-channel-merge/index.js export --output merged.jsonl
```

### API 模式

```javascript
const { mergeChannels } = require('./skills/cross-channel-merge');

const merged = await mergeChannels({
  channels: ['feishu', 'telegram', 'discord'],
  since: '2026-03-01T00:00:00Z',
  userId: 'user-415473008'
});

console.log(`Merged ${merged.count} messages`);
```

### 自动合并 (推荐)

配置自动合并 cron 任务：

```json
{
  "cron": {
    "schedule": "every",
    "everyMs": 3600000,
    "task": "cross-channel-merge"
  }
}
```

每小时自动合并一次各渠道聊天记录。

## 配置文件

### user-mapping.json (用户身份映射)

```json
{
  "mappings": [
    {
      "unifiedUserId": "user-415473008",
      "phone": "+8613421515922",
      "email": "415473008@qq.com",
      "channels": {
        "feishu": "ou_xxx",
        "telegram": "415473008",
        "whatsapp": "+8613421515922"
      }
    }
  ]
}
```

### merge-config.json (合并配置)

```json
{
  "similarityThreshold": 0.9,
  "priorityRules": ["timestamp", "confidence", "priority", "source"],
  "outputFormat": "jsonl",
  "gitVersioning": true,
  "autoMerge": true,
  "mergeIntervalMinutes": 60
}
```

## 数据文件

| 文件 | 用途 |
|------|------|
| `memory/cross-channel/merged.jsonl` | 合并后的统一记录 |
| `memory/cross-channel/user-mapping.json` | 用户身份映射 |
| `memory/cross-channel/duplicates.json` | 去重记录 |
| `memory/cross-channel/conflicts.json` | 冲突解决记录 |

## Git 版本控制 (可选)

```bash
# 初始化 Git repo
cd memory/cross-channel
git init
git remote add origin https://github.com/team/agent-memory.git

# 每次合并后提交
git add merged.jsonl
git commit -m "Merge channels: feishu, telegram, discord"
git push
```

## 输出示例

### 合并后的时间线

```
[08:00] [Feishu] 用户：如何配置阿里巴巴国际站？
[08:01] [Feishu] Agent: 需要配置图片和价格表路径...
[08:05] [Telegram] 用户：图片路径是什么？
[08:06] [Telegram] Agent: G:\国际站图片\产品图\耳钉\待上传
[08:10] [Discord] 用户：价格表在哪？
[08:11] [Discord] Agent: D:\桌面\桌面\国际站\上架表
```

### 去重检测

```
检测到重复内容:
- Feishu [08:00] "如何配置阿里巴巴国际站？"
- Telegram [08:05] "图片路径是什么？" (相似度 0.85, 保留)
- Discord [08:10] "价格表在哪？" (相似度 0.82, 保留)

标记为重复:
- Telegram [08:20] "如何配置国际站？" (相似度 0.95, 标记为 Feishu [08:00] 的重复)
```

## 注意事项

1. **隐私保护** — 合并记录包含敏感信息，需要加密存储
2. **权限控制** — 不同渠道可能有不同的访问权限
3. **数据保留** — 原始渠道记录保留，合并记录作为索引
4. **冲突处理** — 重要冲突需要人工确认

## 相关技能

- `cross-agent-memory` — 跨 Agent 记忆共享
- `session-memory` — 会话记忆管理
- `daily-memory-save` — 每日记忆保存

---

*跨渠道聊天记录合并，打造统一的 Agent 记忆系统！*
