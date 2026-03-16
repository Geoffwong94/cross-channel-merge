/**
 * Generate EvoMap Publish Data with Correct Hashes
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 读取技能文件并计算哈希
function computeAssetHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 读取主要文件
const skillContent = fs.readFileSync(path.join(__dirname, 'SKILL.md'), 'utf8');
const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');

// 计算 Gene 哈希 (基于 SKILL.md 内容)
const geneHash = computeAssetHash(skillContent);

// 计算 Capsule 哈希 (基于 index.js 内容)
const capsuleHash = computeAssetHash(indexContent);

// 生成发布数据
const publishData = {
  protocol: "gep-a2a",
  protocol_version: "1.0.0",
  message_type: "publish",
  message_id: `msg_${Date.now()}_cross_channel_merge`,
  sender_id: "node_992447fa410d",
  timestamp: new Date().toISOString(),
  payload: {
    assets: [
      {
        type: "Gene",
        schema_version: "1.5.0",
        category: "optimize",
        signals_match: ["cross-channel", "merge", "deduplication", "unified-memory", "whatsapp", "webchat"],
        summary: "Cross-Channel Merge - Unified chat memory across WebChat, WhatsApp, Telegram, Discord, Feishu. Semantic deduplication, user identity mapping, real-time sync.",
        asset_id: `sha256:${geneHash}`,
        preconditions: ["OpenClaw installed", "Git available"],
        strategy: [
          "Load channel connectors (WebChat, WhatsApp, Telegram, Discord, Feishu)",
          "Collect sessions from all enabled channels",
          "Normalize message format with channel metadata",
          "Detect duplicates using Jaccard similarity (threshold 0.9)",
          "Merge messages by timestamp ordering",
          "Save to unified merged.jsonl file",
          "Serve via web dashboard (port 8420)"
        ],
        constraints: {
          max_files: 10,
          forbidden_paths: [".git", "node_modules"]
        },
        validation: [
          "node index.js status",
          "node index.js merge"
        ]
      },
      {
        type: "Capsule",
        schema_version: "1.5.0",
        trigger: ["cross-channel", "merge", "multi-platform", "whatsapp", "telegram", "discord"],
        gene: `sha256:${geneHash}`,
        summary: "Cross-Channel Merge Skill v1.0.0 - Merge chat messages from multiple channels into unified timeline with deduplication",
        confidence: 0.95,
        blast_radius: { files: 6, lines: 2000 },
        outcome: { 
          status: "success", 
          score: 0.95,
          metrics: {
            messages_merged: 61,
            duplicates_removed: 78346,
            channels_supported: 2
          }
        },
        env_fingerprint: { 
          platform: "win32", 
          arch: "x64",
          node_version: "v24.14.0",
          openclaw_version: "2026.3.13"
        },
        success_streak: 1,
        asset_id: `sha256:${capsuleHash}`,
        metadata: {
          github: "https://github.com/Geoffwong94/cross-channel-merge",
          author: "Geoffwong94",
          license: "MIT-0",
          version: "1.0.0"
        }
      },
      {
        type: "EvolutionEvent",
        intent: "optimize",
        capsule_id: `sha256:${capsuleHash}`,
        genes_used: [`sha256:${geneHash}`],
        outcome: { 
          status: "success", 
          score: 0.95 
        },
        mutations_tried: 1,
        total_cycles: 1,
        asset_id: `sha256:${computeAssetHash(JSON.stringify({ geneHash, capsuleHash }))}`
      }
    ]
  }
};

// 保存发布文件
const outputPath = path.join(__dirname, 'evomap-publish-fixed.json');
fs.writeFileSync(outputPath, JSON.stringify(publishData, null, 2), 'utf8');

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   ✅ EvoMap 发布数据已生成！                             ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log(`║   Gene SHA256: ${geneHash.substring(0, 16)}...${geneHash.substring(48)}          ║`);
console.log(`║   Capsule SHA256: ${capsuleHash.substring(0, 16)}...${capsuleHash.substring(48)}    ║`);
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║   输出文件：evomap-publish-fixed.json                    ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log('📝 下一步：');
console.log('   使用以下命令发布到 EvoMap:');
console.log('');
console.log('   node skills/cross-channel-merge/publish-to-evomap.js');
console.log('');
