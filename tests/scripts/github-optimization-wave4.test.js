/**
 * GitHub Optimization Wave 4 - Functional Tests
 *
 * Purpose: Validate YAML parsing, JSON structure, section existence, and link
 * resolution for all Wave 4 deliverables.
 *
 * Runs with Node's built-in test runner (plain JS, no compilation needed):
 *   node --test tests/scripts/github-optimization-wave4.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * Helper: read file safely, return null if missing
 */
function readFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Helper: assert file exists
 */
function assertFileExists(relPath) {
  const fullPath = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${relPath}`);
}

/**
 * Helper: basic YAML front-matter parsing (for issue templates)
 * Returns the content between --- delimiters
 */
function extractYamlFrontMatter(content) {
  const normalized = content.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Helper: validate YAML-like structure has required keys
 * Simple line-based check (not a full YAML parser)
 */
function yamlHasKey(content, key) {
  if (typeof content !== 'string') return false;
  const lines = content.split('\n');
  return lines.some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith(key + ':') || trimmed.startsWith(key + ' :');
  });
}

// =============================================================================
// 4.2c: CODEOWNERS
// =============================================================================
describe('4.2c: CODEOWNERS', () => {
  const content = readFile('.github/CODEOWNERS');

  it('file exists', () => {
    assert.ok(content !== null, 'CODEOWNERS file should exist');
  });

  it('has default owner rule', () => {
    assert.ok(content.includes('* @jasonmichaelbell78-creator'));
  });

  it('has workflows owner rule', () => {
    assert.ok(content.includes('.github/workflows/'));
  });

  it('has functions owner rule', () => {
    assert.ok(content.includes('functions/src/'));
  });

  it('has firestore rules owner', () => {
    assert.ok(content.includes('firestore.rules'));
  });
});

// =============================================================================
// 4.2d: Issue Templates
// =============================================================================
describe('4.2d: Issue Templates', () => {
  describe('bug_report.md', () => {
    const content = readFile('.github/ISSUE_TEMPLATE/bug_report.md');

    it('file exists', () => {
      assert.ok(content !== null, 'bug_report.md should exist');
    });

    it('has YAML front matter', () => {
      const fm = extractYamlFrontMatter(content);
      assert.ok(fm !== null, 'Should have YAML front matter');
    });

    it('front matter has name field', () => {
      const fm = extractYamlFrontMatter(content);
      assert.ok(yamlHasKey(fm, 'name'), 'Front matter should have name');
    });

    it('front matter has labels field', () => {
      const fm = extractYamlFrontMatter(content);
      assert.ok(yamlHasKey(fm, 'labels'), 'Front matter should have labels');
    });

    it('includes bug label', () => {
      assert.ok(content.includes('bug'), 'Should include bug label');
    });

    it('has Steps to Reproduce section', () => {
      assert.ok(content.includes('Steps to Reproduce'));
    });

    it('has Environment section', () => {
      assert.ok(content.includes('Environment'));
    });
  });

  describe('feature_request.md', () => {
    const content = readFile('.github/ISSUE_TEMPLATE/feature_request.md');

    it('file exists', () => {
      assert.ok(content !== null, 'feature_request.md should exist');
    });

    it('has YAML front matter', () => {
      const fm = extractYamlFrontMatter(content);
      assert.ok(fm !== null, 'Should have YAML front matter');
    });

    it('includes enhancement label', () => {
      assert.ok(content.includes('enhancement'));
    });

    it('has Privacy Considerations section', () => {
      assert.ok(content.includes('Privacy Considerations'));
    });

    it('has ROADMAP Alignment section', () => {
      assert.ok(content.includes('ROADMAP Alignment'));
    });
  });

  describe('config.yml', () => {
    const content = readFile('.github/ISSUE_TEMPLATE/config.yml');

    it('file exists', () => {
      assert.ok(content !== null, 'config.yml should exist');
    });

    it('has blank_issues_enabled setting', () => {
      assert.ok(yamlHasKey(content, 'blank_issues_enabled'));
    });

    it('has contact_links section', () => {
      assert.ok(yamlHasKey(content, 'contact_links'));
    });

    it('references App Check template', () => {
      assert.ok(
        content.includes('ISSUE_TEMPLATE_APP_CHECK_REENABLE'),
        'Should reference the App Check re-enablement template'
      );
    });

    it('references Security Policy', () => {
      assert.ok(
        content.includes('SECURITY.md'),
        'Should reference SECURITY.md'
      );
    });
  });
});

// =============================================================================
// 4.3a: Copilot Instructions (updated)
// =============================================================================
describe('4.3a: Copilot Instructions', () => {
  const content = readFile('.github/copilot-instructions.md');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has updated test count (~3776)', () => {
    assert.ok(
      content.includes('3776'),
      'Should reference updated test count of ~3776'
    );
  });

  it('does not have stale 77/91 test count', () => {
    assert.ok(
      !content.includes('77/91'),
      'Should not contain old 77/91 test count'
    );
  });

  it('does not have stale ESLint ~115 warnings reference', () => {
    assert.ok(
      !content.includes('~115 warnings'),
      'Should not contain old ~115 warnings'
    );
  });

  it('does not reference compact-meeting-countdown.tsx errors', () => {
    assert.ok(
      !content.includes('compact-meeting-countdown.tsx'),
      'Should not reference resolved compact-meeting-countdown errors'
    );
  });

  it('includes format check in validation steps', () => {
    assert.ok(
      content.includes('format:check'),
      'Should include Prettier format check'
    );
  });

  it('includes pattern check in validation steps', () => {
    assert.ok(
      content.includes('patterns:check'),
      'Should include pattern compliance check'
    );
  });
});

// =============================================================================
// 4.3b: Security Instructions
// =============================================================================
describe('4.3b: Security Instructions', () => {
  const content = readFile('.github/instructions/security.instructions.md');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has Purpose section', () => {
    assert.ok(content.includes('## Purpose'));
  });

  it('has Version History section', () => {
    assert.ok(content.includes('## Version History'));
  });

  it('mentions Cloud Functions', () => {
    assert.ok(content.includes('Cloud Functions'));
  });

  it('mentions httpsCallable', () => {
    assert.ok(content.includes('httpsCallable'));
  });

  it('mentions firestore.rules', () => {
    assert.ok(content.includes('firestore.rules'));
  });

  it('mentions sanitize-error', () => {
    assert.ok(content.includes('sanitize-error'));
  });
});

// =============================================================================
// 4.3c: Test Instructions
// =============================================================================
describe('4.3c: Test Instructions', () => {
  const content = readFile('.github/instructions/tests.instructions.md');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has Purpose section', () => {
    assert.ok(content.includes('## Purpose'));
  });

  it('has Version History section', () => {
    assert.ok(content.includes('## Version History'));
  });

  it('mentions Node built-in test runner', () => {
    assert.ok(content.includes('Node'));
    assert.ok(content.includes('test runner'));
  });

  it('mentions tsconfig.test.json', () => {
    assert.ok(content.includes('tsconfig.test.json'));
  });

  it('warns against Jest APIs', () => {
    assert.ok(content.includes('Jest'));
  });

  it('includes coverage threshold info', () => {
    assert.ok(content.includes('65%'));
  });
});

// =============================================================================
// 4.4: Release Notes & PR Template
// =============================================================================
describe('4.4: Release Notes', () => {
  const content = readFile('.github/release.yml');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has Breaking Changes category', () => {
    assert.ok(content.includes('Breaking Changes'));
  });

  it('has Security category', () => {
    // Check for Security as a title (not just the label)
    assert.ok(content.includes('title: "Security"'));
  });

  it('has Refactoring category', () => {
    assert.ok(content.includes('Refactoring'));
  });

  it('has Testing category', () => {
    assert.ok(content.includes('title: "Testing"'));
  });

  it('still has original categories', () => {
    assert.ok(content.includes('Features'));
    assert.ok(content.includes('Bug Fixes'));
    assert.ok(content.includes('Dependencies'));
  });
});

describe('4.4: PR Template', () => {
  const content = readFile('.github/pull_request_template.md');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has Breaking Changes section', () => {
    assert.ok(content.includes('## Breaking Changes'));
  });

  it('has Risks & Rollback section', () => {
    assert.ok(content.includes('## Risks & Rollback'));
  });

  it('still has original sections', () => {
    assert.ok(content.includes('## What Changed'));
    assert.ok(content.includes('## Testing Done'));
    assert.ok(content.includes('## Pre-Merge Checklist'));
  });
});

// =============================================================================
// 4.5: Dependabot
// =============================================================================
describe('4.5: Dependabot', () => {
  const content = readFile('.github/dependabot.yml');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has github-actions ecosystem', () => {
    assert.ok(content.includes('github-actions'));
  });

  it('has grouping for actions', () => {
    assert.ok(
      content.includes('actions-minor-patch'),
      'Should have actions grouping'
    );
  });

  it('still has npm ecosystems', () => {
    const npmCount = (content.match(/package-ecosystem: "npm"/g) || []).length;
    assert.ok(npmCount >= 2, 'Should have at least 2 npm ecosystem entries');
  });
});

// =============================================================================
// 4.6: Codecov
// =============================================================================
describe('4.6: Codecov Integration', () => {
  describe('CI workflow', () => {
    const content = readFile('.github/workflows/ci.yml');

    it('has codecov action step', () => {
      assert.ok(
        content.includes('codecov/codecov-action'),
        'CI should include codecov action'
      );
    });

    it('codecov action is SHA-pinned', () => {
      assert.ok(
        content.includes(
          'codecov/codecov-action@1af58845a975a7985b0beb0cbe6fbbb71a41dbad'
        ),
        'Codecov action should be SHA-pinned'
      );
    });

    it('has version comment', () => {
      // Check that there is a version comment near the codecov action
      const lines = content.split('\n');
      const codecovLine = lines.findIndex((l) =>
        l.includes('codecov/codecov-action@')
      );
      assert.ok(codecovLine >= 0);
      assert.ok(
        lines[codecovLine].includes('#'),
        'Codecov action line should have version comment'
      );
    });
  });

  describe('codecov.yml', () => {
    const content = readFile('codecov.yml');

    it('file exists', () => {
      assert.ok(content !== null);
    });

    it('has coverage status config', () => {
      assert.ok(yamlHasKey(content, 'coverage'));
    });

    it('has 65% project target matching CI', () => {
      assert.ok(content.includes('65%'));
    });

    it('has ignore paths', () => {
      assert.ok(content.includes('ignore'));
    });
  });
});

// =============================================================================
// 4.7: OpenSSF Scorecard
// =============================================================================
describe('4.7: OpenSSF Scorecard', () => {
  const content = readFile('.github/workflows/scorecard.yml');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has scorecard action SHA-pinned', () => {
    assert.ok(
      content.includes(
        'ossf/scorecard-action@4eaacf0543bb3f2c246792bd56e8cdeffafb205a'
      )
    );
  });

  it('has version comment', () => {
    const lines = content.split('\n');
    const scLine = lines.findIndex((l) =>
      l.includes('ossf/scorecard-action@')
    );
    assert.ok(scLine >= 0);
    assert.ok(lines[scLine].includes('#'), 'Should have version comment');
  });

  it('runs on main branch', () => {
    assert.ok(content.includes('branches: [main]'));
  });

  it('has schedule trigger', () => {
    assert.ok(content.includes('schedule'));
    assert.ok(content.includes('cron'));
  });

  it('uploads SARIF results', () => {
    assert.ok(content.includes('sarif'));
  });

  it('has restrictive default permissions', () => {
    assert.ok(content.includes('contents: read'), 'Should declare contents: read permission');
  });

  it('has Purpose header in comments', () => {
    assert.ok(content.includes('Purpose:'));
  });

  it('has Version History in comments', () => {
    assert.ok(content.includes('Version History'));
  });
});

// =============================================================================
// 4.8: Release Please
// =============================================================================
describe('4.8: Release Please', () => {
  describe('workflow', () => {
    const content = readFile('.github/workflows/release-please.yml');

    it('file exists', () => {
      assert.ok(content !== null);
    });

    it('has release-please action SHA-pinned', () => {
      assert.ok(
        content.includes(
          'googleapis/release-please-action@16a9c90856f42705d54a6fda1823352bdc62cf38'
        )
      );
    });

    it('runs on push to main', () => {
      assert.ok(content.includes('branches: [main]'));
    });

    it('has contents write permission', () => {
      assert.ok(content.includes('contents: write'));
    });

    it('has pull-requests write permission', () => {
      assert.ok(content.includes('pull-requests: write'));
    });

    it('references config file', () => {
      assert.ok(content.includes('release-please-config.json'));
    });

    it('has Purpose header in comments', () => {
      assert.ok(content.includes('Purpose:'));
    });

    it('has Version History in comments', () => {
      assert.ok(content.includes('Version History'));
    });
  });

  describe('config', () => {
    const configPath = path.join(
      ROOT,
      '.github',
      'release-please-config.json'
    );

    it('file exists', () => {
      assert.ok(fs.existsSync(configPath));
    });

    it('is valid JSON', () => {
      let content;
      try {
        content = fs.readFileSync(configPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${configPath}: ${err}`);
      }
      assert.doesNotThrow(() => JSON.parse(content), 'Should be valid JSON');
    });

    it('has packages configuration', () => {
      let content;
      try {
        content = fs.readFileSync(configPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${configPath}: ${err}`);
      }
      const config = JSON.parse(content);
      assert.ok(config.packages, 'Should have packages key');
      assert.ok(config.packages['.'], 'Should have root package config');
    });

    it('has release-type node', () => {
      let content;
      try {
        content = fs.readFileSync(configPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${configPath}: ${err}`);
      }
      const config = JSON.parse(content);
      assert.equal(config.packages['.']['release-type'], 'node');
    });

    it('has changelog sections', () => {
      let content;
      try {
        content = fs.readFileSync(configPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${configPath}: ${err}`);
      }
      const config = JSON.parse(content);
      const sections = config.packages['.']['changelog-sections'];
      assert.ok(Array.isArray(sections), 'changelog-sections should be array');
      assert.ok(sections.length >= 5, 'Should have at least 5 sections');

      const types = new Set(sections.map((s) => s.type));
      assert.ok(types.has('feat'), 'Should have feat section');
      assert.ok(types.has('fix'), 'Should have fix section');
    });
  });

  describe('manifest', () => {
    const manifestPath = path.join(
      ROOT,
      '.release-please-manifest.json'
    );

    it('file exists', () => {
      assert.ok(fs.existsSync(manifestPath));
    });

    it('is valid JSON', () => {
      let content;
      try {
        content = fs.readFileSync(manifestPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${manifestPath}: ${err}`);
      }
      assert.doesNotThrow(() => JSON.parse(content), 'Should be valid JSON');
    });

    it('has root version matching package.json', () => {
      let content;
      try {
        content = fs.readFileSync(manifestPath, 'utf8');
      } catch (err) {
        assert.fail(`Failed to read ${manifestPath}: ${err}`);
      }
      const manifest = JSON.parse(content);
      assert.ok(manifest['.'], 'Should have root entry');
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      } catch (err) {
        assert.fail(`Failed to read package.json: ${err}`);
      }
      assert.equal(manifest['.'], pkg.version, 'Should match package.json version');
    });
  });
});

// =============================================================================
// 4.10: GitHub Guide
// =============================================================================
describe('4.10: GitHub Guide', () => {
  const content = readFile('docs/GITHUB_GUIDE.md');

  it('file exists', () => {
    assert.ok(content !== null);
  });

  it('has Purpose section', () => {
    assert.ok(content.includes('## Purpose'));
  });

  it('has Version History section', () => {
    assert.ok(content.includes('## Version History'));
  });

  it('has all 9 sections', () => {
    const requiredSections = [
      '## 1. Branch Protection',
      '## 2. CI/CD Workflows',
      '## 3. Dependabot',
      '## 4. CODEOWNERS',
      '## 5. Issue Templates',
      '## 6. Pull Request Template',
      '## 7. Release Notes',
      '## 8. Security & Supply Chain',
      '## 9. Copilot / AI Instructions',
    ];

    for (const section of requiredSections) {
      assert.ok(
        content.includes(section),
        `Should have section: ${section}`
      );
    }
  });

  it('references key files', () => {
    const keyFiles = [
      'ci.yml',
      'dependabot.yml',
      'CODEOWNERS',
      'pull_request_template.md',
      'release.yml',
      'scorecard.yml',
      'release-please',
      'codecov.yml',
    ];

    for (const file of keyFiles) {
      assert.ok(
        content.includes(file),
        `Should reference: ${file}`
      );
    }
  });
});

// =============================================================================
// Cross-cutting: SHA-pinning validation
// =============================================================================
describe('Cross-cutting: SHA-pinned actions', () => {
  const workflows = [
    '.github/workflows/ci.yml',
    '.github/workflows/scorecard.yml',
    '.github/workflows/release-please.yml',
  ];

  for (const wf of workflows) {
    describe(wf, () => {
      const content = readFile(wf);

      it('all uses: entries are SHA-pinned or local', () => {
        if (!content) {
          assert.fail(`Workflow file not found: ${wf}`);
          return;
        }

        const lines = content.split('\n');
        const usesLines = lines.filter((l) => l.trim().startsWith('uses:'));

        for (const line of usesLines) {
          const trimmed = line.trim();
          // Local actions (uses: ./) are fine
          if (trimmed.includes('./')) continue;

          // SHA-pinned: should contain @ followed by 40 hex chars
          const shaMatch = trimmed.match(/@([0-9a-f]{40})/);
          assert.ok(
            shaMatch,
            `Action should be SHA-pinned: ${trimmed}`
          );
        }
      });

      it('SHA-pinned actions have version comments', () => {
        if (!content) return;

        const lines = content.split('\n');
        const usesLines = lines.filter(
          (l) => l.trim().startsWith('uses:') && l.includes('@')
        );

        for (const line of usesLines) {
          if (line.includes('./')) continue;
          assert.ok(
            line.includes('#'),
            `SHA-pinned action should have version comment: ${line.trim()}`
          );
        }
      });
    });
  }
});

// =============================================================================
// Cross-cutting: All docs have Purpose + Version History
// =============================================================================
describe('Cross-cutting: Doc headers', () => {
  const docs = [
    '.github/instructions/security.instructions.md',
    '.github/instructions/tests.instructions.md',
    'docs/GITHUB_GUIDE.md',
  ];

  for (const doc of docs) {
    describe(doc, () => {
      const content = readFile(doc);

      it('has Purpose section', () => {
        assert.ok(content !== null, `File should exist: ${doc}`);
        assert.ok(
          content.includes('Purpose'),
          `${doc} should have Purpose section`
        );
      });

      it('has Version History section', () => {
        assert.ok(content !== null, `File should exist: ${doc}`);
        assert.ok(
          content.includes('Version History'),
          `${doc} should have Version History section`
        );
      });
    });
  }
});
