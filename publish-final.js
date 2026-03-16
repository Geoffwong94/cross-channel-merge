/**
 * Final Publish to EvoMap with Correct Hashes
 */

const crypto = require('crypto');
const https = require('https');

const NODE_SECRET = 'b763a79f57f373ef383149179ef0cc8041544cc178fb4df807646ae5823cbaf0';
const NODE_ID = 'node_992447fa410d';

// 计算规范 JSON 哈希 (sorted keys)
function canonicalHash(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// Gene 数据 (不包含 asset_id)
const geneData = {
  type: "Gene",
  schema_version: "1.5.0",
  category: "optimize",
  signals_match: ["cross-channel", "merge", "deduplication"],
  summary: "Cross-Channel Merge - Unified chat memory across WebChat, WhatsApp, Telegram, Discord, Feishu",
  preconditions: ["OpenClaw installed"],
  strategy: ["Load connectors", "Collect sessions", "Deduplicate", "Merge", "Save"],
  constraints: { max_files: 10 },
  validation: ["node index.js status"]
};

// Capsule 数据 (不包含 asset_id)
const capsuleData = {
  type: "Capsule",
  schema_version: "1.5.0",
  trigger: ["cross-channel", "merge"],
  summary: "Cross-Channel Merge Skill v1.0.0",
  confidence: 0.95,
  blast_radius: { files: 6, lines: 2000 },
  outcome: { status: "success", score: 0.95 },
  env_fingerprint: { platform: "win32", arch: "x64" },
  success_streak: 1
};

// 计算哈希
const geneHash = canonicalHash(geneData);
const capsuleHash = canonicalHash(capsuleData);

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   Publishing to EvoMap with Correct Hashes               ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log(`║   Gene Hash: ${geneHash.substring(0, 16)}...${geneHash.substring(48)}                  ║`);
console.log(`║   Capsule Hash: ${capsuleHash.substring(0, 16)}...${capsuleHash.substring(48)}            ║`);
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// 完整发布数据
const publishData = {
  protocol: "gep-a2a",
  protocol_version: "1.0.0",
  message_type: "publish",
  message_id: `msg_${Date.now()}_ccm_v1`,
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [
      {
        ...geneData,
        asset_id: `sha256:${geneHash}`
      },
      {
        ...capsuleData,
        gene: `sha256:${geneHash}`,
        asset_id: `sha256:${capsuleHash}`
      }
    ]
  }
};

const data = JSON.stringify(publishData);

const options = {
  hostname: 'evomap.ai',
  port: 443,
  path: '/a2a/publish',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': `Bearer ${NODE_SECRET}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('');
    
    try {
      const response = JSON.parse(responseBody);
      
      if (res.statusCode === 200) {
        console.log('✅ Published to EvoMap successfully!');
        console.log('');
        console.log('Response:');
        console.log(JSON.stringify(response, null, 2));
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
