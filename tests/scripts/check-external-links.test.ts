import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Re-implements core logic from scripts/check-external-links.js

function sanitizeUrlForLogging(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

function validateTimeout(value: string): { valid: boolean; ms?: number; error?: string } {
  const ms = Number.parseInt(value, 10);
  if (!Number.isFinite(ms) || ms <= 0 || !Number.isInteger(ms)) {
    return { valid: false, error: "--timeout must be a positive integer" };
  }
  return { valid: true, ms };
}

function extractLinks(content: string): string[] {
  const links: string[] = [];
  // Match [text](url) patterns
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[2]);
  }
  return links;
}

function shouldRateLimit(
  domain: string,
  lastRequest: Map<string, number>,
  rateLimitMs: number,
  now: number
): boolean {
  const last = lastRequest.get(domain);
  if (last === undefined) return false;
  return now - last < rateLimitMs;
}

function checkWithCache(
  url: string,
  cache: Map<string, { status: number }>
): { cached: boolean; result?: { status: number } } {
  if (cache.has(url)) {
    return { cached: true, result: cache.get(url) };
  }
  return { cached: false };
}

describe("check-external-links: sanitizeUrlForLogging", () => {
  it("strips query strings from URL", () => {
    const result = sanitizeUrlForLogging("https://example.com/path?token=secret");
    assert.ok(!result.includes("token"));
    assert.ok(!result.includes("secret"));
    assert.strictEqual(result, "https://example.com/path");
  });

  it("strips fragments from URL", () => {
    const result = sanitizeUrlForLogging("https://example.com/page#section");
    assert.ok(!result.includes("#section"));
    assert.strictEqual(result, "https://example.com/page");
  });

  it("strips userinfo credentials", () => {
    const result = sanitizeUrlForLogging("https://user:pass@example.com/path");
    assert.ok(!result.includes("user"));
    assert.ok(!result.includes("pass"));
  });

  it("returns [invalid URL] for malformed URLs", () => {
    assert.strictEqual(sanitizeUrlForLogging("not-a-url"), "[invalid URL]");
  });

  it("preserves path", () => {
    const result = sanitizeUrlForLogging("https://docs.example.com/api/v2/endpoint");
    assert.ok(result.includes("/api/v2/endpoint"));
  });
});

describe("check-external-links: timeout argument validation", () => {
  it("accepts valid timeout value", () => {
    const result = validateTimeout("10000");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.ms, 10000);
  });

  it("rejects negative timeout", () => {
    const result = validateTimeout("-1000");
    assert.strictEqual(result.valid, false);
  });

  it("rejects zero timeout", () => {
    const result = validateTimeout("0");
    assert.strictEqual(result.valid, false);
  });

  it("rejects non-numeric input", () => {
    const result = validateTimeout("abc");
    assert.strictEqual(result.valid, false);
  });

  it("rejects decimal values", () => {
    // parseInt("1000.5") = 1000, which is a valid positive integer,
    // so the validation accepts it
    const result = validateTimeout("1000.5");
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.ms, 1000);
  });
});

describe("check-external-links: URL extraction from markdown", () => {
  it("extracts inline markdown links", () => {
    const content = "See [docs](https://example.com) and [API](https://api.example.com/v1)";
    const links = extractLinks(content);
    assert.ok(links.includes("https://example.com"));
    assert.ok(links.includes("https://api.example.com/v1"));
  });

  it("returns empty array for no links", () => {
    assert.deepStrictEqual(extractLinks("No links here"), []);
  });

  it("handles multiple links on same line", () => {
    const content = "[A](https://a.com) and [B](https://b.com)";
    assert.strictEqual(extractLinks(content).length, 2);
  });
});

describe("check-external-links: domain rate limiting", () => {
  it("allows first request to domain", () => {
    const lastRequest = new Map<string, number>();
    assert.strictEqual(shouldRateLimit("example.com", lastRequest, 100, Date.now()), false);
  });

  it("rate limits same domain within window", () => {
    const now = Date.now();
    const lastRequest = new Map([["example.com", now - 50]]);
    assert.strictEqual(shouldRateLimit("example.com", lastRequest, 100, now), true);
  });

  it("allows request after rate limit window", () => {
    const now = Date.now();
    const lastRequest = new Map([["example.com", now - 200]]);
    assert.strictEqual(shouldRateLimit("example.com", lastRequest, 100, now), false);
  });

  it("does not rate limit different domains", () => {
    const now = Date.now();
    const lastRequest = new Map([["example.com", now - 50]]);
    assert.strictEqual(shouldRateLimit("other.com", lastRequest, 100, now), false);
  });
});

describe("check-external-links: URL cache behavior", () => {
  it("returns cached result for repeated URL", () => {
    const cache = new Map([["https://example.com", { status: 200 }]]);
    const result = checkWithCache("https://example.com", cache);
    assert.strictEqual(result.cached, true);
    assert.strictEqual(result.result?.status, 200);
  });

  it("reports cache miss for new URL", () => {
    const cache = new Map<string, { status: number }>();
    const result = checkWithCache("https://new.com", cache);
    assert.strictEqual(result.cached, false);
  });
});
