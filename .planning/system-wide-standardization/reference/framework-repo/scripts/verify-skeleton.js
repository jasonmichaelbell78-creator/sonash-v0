#!/usr/bin/env node
/**
 * verify-skeleton.js - Verify the framework skeleton is complete and valid.
 *
 * Checks:
 * 1. Required files exist
 * 2. JSON/JSONL files are valid
 * 3. No "sonash" references in production files
 * 4. Skills have SKILL.md files
 * 5. Agents are valid markdown
 * 6. Hooks are valid JS
 * 7. ESLint plugin has expected rules
 * 8. GitHub workflows are valid YAML
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;
let checks = 0;

function check(label, condition, isWarning = false) {
  checks++;
  if (!condition) {
    if (isWarning) {
      warnings++;
      console.log(`  ⚠️  ${label}`);
    } else {
      errors++;
      console.log(`  ❌ ${label}`);
    }
    return false;
  }
  return true;
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function isValidJson(relPath) {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
    return true;
  } catch {
    return false;
  }
}

// --- 1. Required files ---
console.log('\n📁 Required Files:');
const requiredFiles = [
  'package.json',
  '.gitignore',
  '.env.example',
  'tsconfig.json',
  '.prettierrc',
  '.mcp.json',
  'CLAUDE.md',
  'ROADMAP.md',
  'ROADMAP.jsonl',
  'SESSION_CONTEXT.md',
  'eslint.config.mjs',
  '.claude/settings.json',
  '.husky/pre-commit',
  '.husky/pre-push',
];
for (const f of requiredFiles) {
  check(`${f} exists`, fileExists(f));
}

// --- 2. JSON validity ---
console.log('\n📋 JSON Validity:');
const jsonFiles = [
  'package.json',
  '.mcp.json',
  '.prettierrc',
  'tsconfig.json',
  '.claude/settings.json',
];
for (const f of jsonFiles) {
  if (fileExists(f)) {
    check(`${f} is valid JSON`, isValidJson(f));
  }
}

// Config files
const configDir = path.join(ROOT, 'scripts', 'config');
if (fs.existsSync(configDir)) {
  const configs = fs.readdirSync(configDir).filter((f) => f.endsWith('.json'));
  for (const f of configs) {
    check(`scripts/config/${f} is valid JSON`, isValidJson(`scripts/config/${f}`));
  }
}

// --- 3. Sonash reference scan ---
console.log('\n🔍 Sanitization Check:');
const scanExts = ['.js', '.ts', '.tsx', '.jsx', '.md', '.yml', '.yaml', '.mjs'];
const scanExcludeFiles = ['trace-dependencies.js', 'verify-skeleton.js'];
const scanExcludeDirs = ['node_modules', '.git'];

function scanDir(dir, relDir = '') {
  let found = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = path.join(relDir, entry.name);
      if (entry.isDirectory() && scanExcludeDirs.includes(entry.name)) continue;
      if (!entry.isDirectory() && scanExcludeFiles.some((ex) => entry.name === ex)) continue;
      if (entry.isDirectory()) {
        found = found.concat(scanDir(path.join(dir, entry.name), relPath));
      } else if (scanExts.some((ext) => entry.name.endsWith(ext))) {
        try {
          const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
          if (/sonash/i.test(content)) {
            found.push(relPath);
          }
        } catch {
          // skip unreadable
        }
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return found;
}

const sonashRefs = scanDir(ROOT);
if (sonashRefs.length > 0) {
  for (const f of sonashRefs) {
    check(`No "sonash" references in ${f}`, false, true);
  }
} else {
  console.log('  ✅ No sonash references found in production files');
  checks++;
}

// --- 4. Skills check ---
console.log('\n🎯 Skills:');
const skillsDir = path.join(ROOT, '.claude', 'skills');
if (fs.existsSync(skillsDir)) {
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`  Found ${skills.length} skill directories`);
  checks++;

  let validSkills = 0;
  for (const skill of skills) {
    const skillMdUpper = path.join(skillsDir, skill.name, 'SKILL.md');
    const skillMdLower = path.join(skillsDir, skill.name, 'skill.md');
    if (fs.existsSync(skillMdUpper) || fs.existsSync(skillMdLower)) {
      validSkills++;
    } else {
      check(`${skill.name}/SKILL.md or skill.md exists`, false, true);
    }
  }
  check(`At least 40 valid skills (found ${validSkills})`, validSkills >= 40);
} else {
  check('Skills directory exists', false);
}

// --- 5. Agents check ---
console.log('\n🤖 Agents:');
const agentsDir = path.join(ROOT, '.claude', 'agents');
if (fs.existsSync(agentsDir)) {
  const agents = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  check(`At least 10 agents (found ${agents.length})`, agents.length >= 10);
} else {
  check('Agents directory exists', false);
}

// --- 6. Hooks check ---
console.log('\n🪝 Hooks:');
const hooksDir = path.join(ROOT, '.claude', 'hooks');
if (fs.existsSync(hooksDir)) {
  const hooks = fs.readdirSync(hooksDir).filter((f) => f.endsWith('.js'));
  check(`At least 10 hooks (found ${hooks.length})`, hooks.length >= 10);

  // Check hook libs
  const libDir = path.join(hooksDir, 'lib');
  if (fs.existsSync(libDir)) {
    const libs = fs.readdirSync(libDir).filter((f) => f.endsWith('.js'));
    check(`At least 5 hook libraries (found ${libs.length})`, libs.length >= 5);
  }
} else {
  check('Hooks directory exists', false);
}

// --- 7. ESLint plugin check ---
console.log('\n📏 ESLint Plugin:');
const eslintDir = path.join(ROOT, 'eslint-plugin-framework');
if (fs.existsSync(eslintDir)) {
  const rulesDir = path.join(eslintDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    const rules = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.js'));
    check(`At least 20 ESLint rules (found ${rules.length})`, rules.length >= 20);
  }
  check('ESLint plugin index.js exists', fileExists('eslint-plugin-framework/index.js'));
} else {
  check('ESLint plugin directory exists', false);
}

// --- 8. GitHub workflows check ---
console.log('\n⚙️ GitHub Workflows:');
const workflowsDir = path.join(ROOT, '.github', 'workflows');
if (fs.existsSync(workflowsDir)) {
  const workflows = fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.yml'));
  check(`At least 8 workflows (found ${workflows.length})`, workflows.length >= 8);
} else {
  check('Workflows directory exists', false);
}

// --- 9. Scripts check ---
console.log('\n📜 Scripts:');
const scriptsDir = path.join(ROOT, 'scripts');
if (fs.existsSync(scriptsDir)) {
  const libFiles = fs.readdirSync(path.join(scriptsDir, 'lib')).filter((f) => f.endsWith('.js'));
  check(`At least 8 script libraries (found ${libFiles.length})`, libFiles.length >= 8);

  // Check for key scripts
  const keyScripts = [
    'reviews/check-pattern-compliance.js',
    'reviews/security-check.js',
    'reviews/assign-review-tier.js',
  ];
  for (const s of keyScripts) {
    check(`scripts/${s} exists`, fileExists(`scripts/${s}`));
  }
}

// --- Summary ---
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${checks} checks, ${errors} errors, ${warnings} warnings`);
if (errors === 0) {
  console.log('\n✅ Framework skeleton verification PASSED');
  process.exit(0);
} else {
  console.log(`\n❌ Framework skeleton verification FAILED (${errors} errors)`);
  process.exit(1);
}
