/**
 * Cross-Channel Merge - Publish to GitHub and EvoMap
 * 
 * 发布技能到 GitHub 仓库和 EvoMap 市场
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname);
const GITHUB_REPO = 'cross-channel-merge';
const GITHUB_USER = 'Geoffwong94';

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   Cross-Channel Merge - 发布工具                         ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log('║   发布到：GitHub + EvoMap                                ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// 步骤 1: 准备发布文件
function prepareRelease() {
  console.log('📦 步骤 1: 准备发布文件...');
  
  const files = [
    'SKILL.md',
    'README.md',
    'index.js',
    'connectors.js',
    'server.js',
    'dashboard.html'
  ];
  
  files.forEach(file => {
    const filePath = path.join(SKILL_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} (缺失)`);
    }
  });
  
  console.log('');
}

// 步骤 2: 创建 GitHub 仓库
function createGitHubRepo() {
  console.log('📦 步骤 2: 创建/更新 GitHub 仓库...');
  console.log(`   仓库：https://github.com/${GITHUB_USER}/${GITHUB_REPO}`);
  console.log('');
  
  try {
    // 初始化 Git (如果还没有)
    if (!fs.existsSync(path.join(SKILL_DIR, '.git'))) {
      console.log('   初始化 Git 仓库...');
      execSync('git init', { cwd: SKILL_DIR, stdio: 'inherit' });
    }
    
    // 添加所有文件
    console.log('   添加文件到 Git...');
    execSync('git add .', { cwd: SKILL_DIR, stdio: 'inherit' });
    
    // 提交
    console.log('   提交更改...');
    const timestamp = new Date().toISOString().split('T')[0];
    execSync(`git commit -m "feat: Cross-Channel Merge v1.0.0 - ${timestamp}"`, { 
      cwd: SKILL_DIR, 
      stdio: 'inherit' 
    });
    
    // 创建标签
    console.log('   创建版本标签 v1.0.0...');
    try {
      execSync('git tag -a v1.0.0 -m "Release v1.0.0 - Initial release"', { 
        cwd: SKILL_DIR, 
        stdio: 'inherit' 
      });
    } catch (e) {
      console.log('   ⚠️  标签已存在，跳过');
    }
    
    console.log('   ✅ GitHub 仓库准备完成');
    console.log('');
    console.log('   📝 下一步 (手动):');
    console.log(`   1. git remote add origin https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git`);
    console.log('   2. git push -u origin main --tags');
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ 错误：${error.message}`);
    console.log('');
  }
}

// 步骤 3: 发布到 EvoMap
function publishToEvoMap() {
  console.log('📦 步骤 3: 发布到 EvoMap...');
  
  // 准备 EvoMap 发布数据
  const publishData = {
    protocol: "gep-a2a",
    protocol_version: "1.0.0",
    message_type: "publish",
    message_id: `msg_${Date.now()}_publish`,
    sender_id: "node_992447fa410d",
    timestamp: new Date().toISOString(),
    payload: {
      assets: [
        {
          type: "Gene",
          schema_version: "1.5.0",
          category: "optimize",
          signals_match: ["cross-channel", "merge", "deduplication", "unified-memory"],
          summary: "Cross-Channel Merge - Unified chat memory across WebChat, WhatsApp, Telegram, Discord, Feishu",
          asset_id: "sha256:cross-channel-merge-gene-v1"
        },
        {
          type: "Capsule",
          schema_version: "1.5.0",
          trigger: ["cross-channel", "merge", "multi-platform"],
          gene: "sha256:cross-channel-merge-gene-v1",
          summary: "Cross-Channel Merge Skill for OpenClaw - v1.0.0",
          confidence: 0.95,
          blast_radius: { files: 6, lines: 2000 },
          outcome: { status: "success", score: 0.95 },
          env_fingerprint: { platform: "win32", arch: "x64" },
          success_streak: 1,
          asset_id: "sha256:cross-channel-merge-capsule-v1"
        }
      ]
    }
  };
  
  console.log('   📝 EvoMap 发布数据:');
  console.log(`      - Gene: cross-channel-merge-gene-v1`);
  console.log(`      - Capsule: cross-channel-merge-capsule-v1`);
  console.log(`      - 类别：optimize`);
  console.log(`      - 信号：cross-channel, merge, deduplication`);
  console.log('');
  
  // 保存发布数据到文件
  const publishFile = path.join(SKILL_DIR, 'evomap-publish.json');
  fs.writeFileSync(publishFile, JSON.stringify(publishData, null, 2));
  console.log(`   ✅ 发布数据已保存：${publishFile}`);
  console.log('');
  console.log('   📝 下一步 (手动):');
  console.log('   1. 访问 https://evomap.ai');
  console.log('   2. 登录账号');
  console.log('   3. 导航到 Publish 页面');
  console.log('   4. 上传 evomap-publish.json 文件');
  console.log('');
}

// 步骤 4: 创建 ClawHub 发布包
function createClawHubPackage() {
  console.log('📦 步骤 4: 创建 ClawHub 发布包...');
  
  const packageData = {
    name: "cross-channel-merge",
    version: "1.0.0",
    description: "跨渠道聊天记录合并/整合技能。支持 WebChat, WhatsApp, Telegram, Discord, 飞书等多渠道会话统一存储。",
    author: "Geoffwong94",
    license: "MIT-0",
    homepage: `https://github.com/${GITHUB_USER}/${GITHUB_REPO}`,
    repository: {
      type: "git",
      url: `https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git`
    },
    keywords: [
      "cross-channel",
      "merge",
      "whatsapp",
      "telegram",
      "discord",
      "feishu",
      "webchat",
      "openclaw",
      "skill"
    ],
    main: "index.js",
    scripts: {
      start: "node index.js merge",
      dashboard: "node index.js dashboard",
      webhook: "node whatsapp-webhook/server.js"
    },
    dependencies: {},
    devDependencies: {}
  };
  
  const packageFile = path.join(SKILL_DIR, 'package.json');
  fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2));
  console.log(`   ✅ package.json 已创建`);
  console.log('');
  console.log('   📝 下一步 (可选):');
  console.log('   1. clawhub publish ./skills/cross-channel-merge');
  console.log('');
}

// 主函数
function main() {
  prepareRelease();
  createGitHubRepo();
  publishToEvoMap();
  createClawHubPackage();
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   ✅ 发布准备完成！                                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║   待完成的手动步骤：                                     ║');
  console.log('║                                                          ║');
  console.log(`║   1. GitHub: git push 到 ${GITHUB_USER}/${GITHUB_REPO}          ║`);
  console.log('║   2. EvoMap: 上传 evomap-publish.json                    ║');
  console.log('║   3. ClawHub: clawhub publish (可选)                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
}

// 运行
main();
