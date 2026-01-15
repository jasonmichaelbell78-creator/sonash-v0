import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  findErrorKnowledge,
  getSeverityColor,
  getSeverityLabel,
  ERROR_KNOWLEDGE_BASE,
  type ErrorKnowledge,
} from "../lib/error-knowledge-base";

describe("error-knowledge-base", () => {
  describe("findErrorKnowledge", () => {
    test("matches authentication errors", () => {
      const knowledge = findErrorKnowledge("auth token expired");
      assert.equal(knowledge.component, "Authentication");
      assert.ok(knowledge.description.includes("authentication"));
    });

    test("matches authorization/permission errors", () => {
      const knowledge = findErrorKnowledge("Permission denied for user");
      assert.equal(knowledge.component, "Authorization");
      assert.ok(knowledge.possibleCauses.length > 0);
    });

    test("matches Sentry fetch errors", () => {
      const knowledge = findErrorKnowledge("Failed to fetch Sentry summary");
      assert.equal(knowledge.component, "Monitoring");
      assert.ok(knowledge.remediations.some((r) => r.includes("SENTRY")));
    });

    test("matches dashboard loading errors", () => {
      const knowledge = findErrorKnowledge("Failed to load dashboard data");
      assert.equal(knowledge.component, "Admin Dashboard");
    });

    test("matches Firestore quota errors", () => {
      const knowledge = findErrorKnowledge("Firestore quota exceeded");
      assert.equal(knowledge.component, "Database");
      assert.equal(knowledge.severity, "critical");
    });

    test("matches network errors", () => {
      const knowledge = findErrorKnowledge("Network request failed");
      assert.equal(knowledge.component, "Network");
    });

    test("matches rate limit errors", () => {
      const knowledge = findErrorKnowledge("Rate limit exceeded");
      assert.equal(knowledge.component, "Security");
    });

    test("matches React hydration errors", () => {
      const knowledge = findErrorKnowledge("Hydration mismatch detected");
      assert.equal(knowledge.component, "UI");
    });

    test("returns fallback for unknown errors", () => {
      const knowledge = findErrorKnowledge("Some completely unknown error xyz123");
      assert.equal(knowledge.component, "Unknown");
      assert.ok(knowledge.description.includes("unexpected"));
    });

    test("pattern matching is case-insensitive", () => {
      const lowerCase = findErrorKnowledge("auth token expired");
      const upperCase = findErrorKnowledge("AUTH TOKEN EXPIRED");
      const mixedCase = findErrorKnowledge("Auth Token Expired");

      assert.equal(lowerCase.component, upperCase.component);
      assert.equal(lowerCase.component, mixedCase.component);
    });
  });

  describe("getSeverityColor", () => {
    test("returns correct color for critical", () => {
      const color = getSeverityColor("critical");
      assert.ok(color.includes("red"));
      assert.ok(color.includes("bg-"));
      assert.ok(color.includes("text-"));
    });

    test("returns correct color for high", () => {
      const color = getSeverityColor("high");
      assert.ok(color.includes("orange"));
    });

    test("returns correct color for medium", () => {
      const color = getSeverityColor("medium");
      assert.ok(color.includes("amber"));
    });

    test("returns correct color for low", () => {
      const color = getSeverityColor("low");
      assert.ok(color.includes("green"));
    });

    test("all severities return valid CSS classes", () => {
      const severities: ErrorKnowledge["severity"][] = ["critical", "high", "medium", "low"];

      for (const severity of severities) {
        const color = getSeverityColor(severity);
        assert.ok(color.includes("text-"), `${severity} should have text class`);
        assert.ok(color.includes("bg-"), `${severity} should have bg class`);
        assert.ok(color.includes("border-"), `${severity} should have border class`);
      }
    });
  });

  describe("getSeverityLabel", () => {
    test("returns correct label for critical", () => {
      assert.equal(getSeverityLabel("critical"), "Critical Impact");
    });

    test("returns correct label for high", () => {
      assert.equal(getSeverityLabel("high"), "High Impact");
    });

    test("returns correct label for medium", () => {
      assert.equal(getSeverityLabel("medium"), "Medium Impact");
    });

    test("returns correct label for low", () => {
      assert.equal(getSeverityLabel("low"), "Low Impact");
    });
  });

  describe("ERROR_KNOWLEDGE_BASE structure", () => {
    test("all entries have required fields", () => {
      for (const entry of ERROR_KNOWLEDGE_BASE) {
        assert.ok(entry.pattern instanceof RegExp, "pattern should be RegExp");
        assert.ok(typeof entry.description === "string", "description should be string");
        assert.ok(Array.isArray(entry.possibleCauses), "possibleCauses should be array");
        assert.ok(entry.possibleCauses.length > 0, "possibleCauses should not be empty");
        assert.ok(Array.isArray(entry.remediations), "remediations should be array");
        assert.ok(entry.remediations.length > 0, "remediations should not be empty");
        assert.ok(
          ["critical", "high", "medium", "low"].includes(entry.severity),
          "severity should be valid"
        );
        assert.ok(typeof entry.component === "string", "component should be string");
      }
    });

    test("has entries for common error categories", () => {
      const components = ERROR_KNOWLEDGE_BASE.map((e) => e.component);

      assert.ok(components.includes("Authentication"), "should have Authentication");
      assert.ok(components.includes("Authorization"), "should have Authorization");
      assert.ok(components.includes("Database"), "should have Database");
      assert.ok(components.includes("Network"), "should have Network");
      assert.ok(components.includes("Security"), "should have Security");
    });

    test("patterns do not overlap in problematic ways", () => {
      // Test that specific patterns match before general ones
      const authError = findErrorKnowledge("auth token expired");
      const networkError = findErrorKnowledge("network error");

      // These should match different patterns
      assert.notEqual(authError.component, networkError.component);
    });
  });
});
