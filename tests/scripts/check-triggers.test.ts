import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-triggers.js

describe("check-triggers: TRIGGERS configuration", () => {
  const TRIGGERS = {
    security_audit: {
      severity: "blocking",
      patterns: [/auth/i, /token/i, /credential/i, /secret/i, /password/i, /jwt/i, /crypto/i],
    },
    consolidation: {
      severity: "warning",
      threshold: 2,
    },
    skill_validation: {
      severity: "warning",
      paths: [".claude/skills/", ".claude/commands/"],
    },
    review_sync: {
      severity: "warning",
    },
  };

  it("security_audit is blocking severity", () => {
    assert.strictEqual(TRIGGERS.security_audit.severity, "blocking");
  });

  it("security patterns include auth", () => {
    assert.ok(TRIGGERS.security_audit.patterns.some((p) => p.test("auth/verify.ts")));
  });

  it("security patterns include crypto", () => {
    assert.ok(TRIGGERS.security_audit.patterns.some((p) => p.test("crypto-utils.ts")));
  });

  it("session pattern NOT in security triggers (too broad)", () => {
    // session was removed per code comment
    assert.ok(!TRIGGERS.security_audit.patterns.some((p) => p.source === "session"));
  });

  it("consolidation has warning severity", () => {
    assert.strictEqual(TRIGGERS.consolidation.severity, "warning");
  });
});

describe("check-triggers: security file detection", () => {
  const SECURITY_PATTERNS = [
    /auth/i,
    /token/i,
    /credential/i,
    /secret/i,
    /password/i,
    /jwt/i,
    /crypto/i,
  ];

  function isSecurityFile(filePath: string): boolean {
    return SECURITY_PATTERNS.some((p) => p.test(filePath));
  }

  it("detects auth files", () => {
    assert.strictEqual(isSecurityFile("src/lib/auth/verify.ts"), true);
  });

  it("detects token files", () => {
    assert.strictEqual(isSecurityFile("hooks/useToken.ts"), true);
  });

  it("detects credential files", () => {
    assert.strictEqual(isSecurityFile("credentials-manager.ts"), true);
  });

  it("does not flag non-security files", () => {
    assert.strictEqual(isSecurityFile("components/Button.tsx"), false);
  });

  it("does not false-positive on session files (known issue fix)", () => {
    // session files would trigger the removed /session/i pattern — verify NOT triggered now
    const sessionFile = "scripts/session-start.sh";
    const hasAuthPattern = /auth|token|credential|secret|password|jwt|crypto/i.test(sessionFile);
    assert.strictEqual(hasAuthPattern, false);
  });
});

describe("check-triggers: skill validation detection", () => {
  const SKILL_PATHS = [".claude/skills/", ".claude/commands/"];

  function isSkillFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, "/");
    return SKILL_PATHS.some((p) => normalized.startsWith(p));
  }

  it("detects skill files", () => {
    assert.strictEqual(isSkillFile(".claude/skills/deep-plan/SKILL.md"), true);
  });

  it("detects command files", () => {
    assert.strictEqual(isSkillFile(".claude/commands/session-end.md"), true);
  });

  it("does not flag normal source files", () => {
    assert.strictEqual(isSkillFile("src/components/Button.tsx"), false);
  });
});

describe("check-triggers: tryGitDiff result parsing", () => {
  function parseGitOutput(output: string): string[] {
    return output.split("\n").filter((f) => f.trim());
  }

  it("parses list of changed files", () => {
    const output = "src/auth.ts\nlib/token.ts\n";
    const files = parseGitOutput(output);
    assert.deepStrictEqual(files, ["src/auth.ts", "lib/token.ts"]);
  });

  it("filters empty lines", () => {
    const output = "\nsrc/auth.ts\n\nlib/token.ts\n";
    assert.strictEqual(parseGitOutput(output).length, 2);
  });

  it("returns empty for no changes", () => {
    assert.deepStrictEqual(parseGitOutput(""), []);
  });
});

describe("check-triggers: exit code logic", () => {
  type Severity = "blocking" | "warning";

  function computeExitCode(triggers: Array<{ severity: Severity }>): number {
    if (triggers.some((t) => t.severity === "blocking")) return 1;
    return 0;
  }

  it("returns 1 for blocking triggers", () => {
    assert.strictEqual(computeExitCode([{ severity: "blocking" }]), 1);
  });

  it("returns 0 for warnings only", () => {
    assert.strictEqual(computeExitCode([{ severity: "warning" }]), 0);
  });

  it("returns 0 for no triggers", () => {
    assert.strictEqual(computeExitCode([]), 0);
  });
});
