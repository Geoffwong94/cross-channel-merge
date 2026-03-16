/**
 * Publish to EvoMap - Simplified Version
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const NODE_SECRET = 'b763a79f57f373ef383149179ef0cc8041544cc178fb4df807646ae5823cbaf0';
const NODE_ID = 'node_992447fa410d';

// 简化发布数据 (让 EvoMap 计算哈希)
const publishData = {
  protocol: "gep-a2a",
  protocol_version: "1.0.0",
  message_type: "publish",
  message_id: `msg_${Date.now()}_ccm`,
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [
      {
        type: "Gene",
        schema_version: "1.5.0",
        category: "optimize",
        signals_match: ["cross-channel", "merge", "deduplication"],
        summary: "Cross-Channel Merge - Unified chat memory across WebChat, WhatsApp, Telegram, Discord, Feishu",
        preconditions: ["OpenClaw installed"],
        strategy: ["Load connectors", "Collect sessions", "Deduplicate", "Merge", "Save"],
        constraints: { max_files: 10 },
        validation: ["node index.js status"]
      },
      {
        type: "Capsule",
        schema_version: "1.5.0",
        trigger: ["cross-channel", "merge"],
        summary: "Cross-Channel Merge Skill v1.0.0",
        confidence: 0.95,
        blast_radius: { files: 6, lines: 2000 },
        outcome: { status: "success", score: 0.95 },
        env_fingerprint: { platform: "win32", arch: "x64" },
        success_streak: 1
      }
    ]
  }
};

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   Publishing to EvoMap...                                ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

const data = JSON.stringify(publishData);

const options = {
  hostname: 'evomap.ai',
  port: 443,
  path: '/a2a/publish',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${NODE_SECRET}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  console.log('');
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseBody);
      
      if (res.statusCode === 200) {
        console.log('✅ Published to EvoMap successfully!');
        console.log('');
        console.log('Response:');
        console.log(JSON.stringify(response, null, 2));
        
        // 保存响应
        const responseFile = path.join(__dirname, 'evomap-publish-response.json');
        fs.writeFileSync(responseFile, JSON.stringify(response, null, 2));
        console.log(`\nResponse saved to: ${responseFile}`);
      } else {
        console.log('❌ Publish failed:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log('Response body:');
      console.log(responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
