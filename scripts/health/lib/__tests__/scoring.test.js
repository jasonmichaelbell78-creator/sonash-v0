/* eslint-disable no-undef */
"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { scoreMetric, computeGrade, sparkline, computeTrend, compositeScore } = require(
  path.join(__dirname, "..", "scoring.js")
);

describe("scoreMetric", () => {
  describe("lower-is-better (default direction)", () => {
    const bench = { good: 0, average: 5, poor: 10 };

    it("returns score=100 and rating=good when value equals good threshold", () => {
      const r = scoreMetric(0, bench);
      assert.equal(r.score, 100);
      assert.equal(r.rating, "good");
    });

    it("returns score=100 and rating=good when value is below good threshold", () => {
      const r = scoreMetric(-10, bench);
      assert.equal(r.score, 100);
      assert.equal(r.rating, "good");
    });

    it("returns average rating for value between good and average thresholds", () => {
      const r = scoreMetric(3, bench);
      assert.equal(r.rating, "average");
      assert.ok(r.score >= 60 && r.score <= 100, `score ${r.score} out of expected range`);
    });

    it("returns score=60 at the average threshold boundary", () => {
      // At value=average: offset/range=1, score = 80 - 1*20 = 60
      const r = scoreMetric(5, bench);
      assert.equal(r.rating, "average");
      assert.equal(r.score, 60);
    });

    it("returns poor rating and score >= 0 for values beyond poor threshold", () => {
      const r = scoreMetric(20, bench);
      assert.equal(r.rating, "poor");
      assert.ok(r.score >= 0);
    });

    it("returns score=0 and rating=poor for NaN input", () => {
      const r = scoreMetric(Number.NaN, bench);
      assert.equal(r.score, 0);
      assert.equal(r.rating, "poor");
    });

    it("returns score=0 and rating=poor for non-number input", () => {
      const r = scoreMetric("hello", bench);
      assert.equal(r.score, 0);
      assert.equal(r.rating, "poor");
    });

    it("clamps score to [0, 100] for very large values", () => {
      const r = scoreMetric(10000, bench);
      assert.ok(r.score >= 0 && r.score <= 100);
    });

    it("handles benchmark where good equals average without division by zero", () => {
      const flatBench = { good: 5, average: 5, poor: 10 };
      const r = scoreMetric(5, flatBench);
      assert.ok(r.score >= 0 && r.score <= 100);
    });
  });

  describe("higher-is-better direction", () => {
    const bench = { good: 100, average: 80, poor: 60 };

    it("returns score=100 and rating=good when value meets good threshold", () => {
      const r = scoreMetric(100, bench, "higher-is-better");
      assert.equal(r.score, 100);
      assert.equal(r.rating, "good");
    });

    it("returns score=100 for value above good threshold", () => {
      const r = scoreMetric(120, bench, "higher-is-better");
      assert.equal(r.score, 100);
      assert.equal(r.rating, "good");
    });

    it("returns average rating when value is between average and good", () => {
      const r = scoreMetric(90, bench, "higher-is-better");
      assert.equal(r.rating, "average");
      assert.ok(r.score >= 80 && r.score <= 100);
    });

    it("returns poor rating and score >= 0 when below poor threshold", () => {
      const r = scoreMetric(40, bench, "higher-is-better");
      assert.equal(r.rating, "poor");
      assert.ok(r.score >= 0);
    });
  });
});

describe("computeGrade", () => {
  it("returns A for score >= 90", () => {
    assert.equal(computeGrade(90), "A");
    assert.equal(computeGrade(100), "A");
    assert.equal(computeGrade(95), "A");
  });

  it("returns B for score in [80, 89]", () => {
    assert.equal(computeGrade(80), "B");
    assert.equal(computeGrade(85), "B");
    assert.equal(computeGrade(89), "B");
  });

  it("returns C for score in [70, 79]", () => {
    assert.equal(computeGrade(70), "C");
    assert.equal(computeGrade(75), "C");
  });

  it("returns D for score in [60, 69]", () => {
    assert.equal(computeGrade(60), "D");
    assert.equal(computeGrade(65), "D");
  });

  it("returns F for score < 60", () => {
    assert.equal(computeGrade(59), "F");
    assert.equal(computeGrade(0), "F");
  });

  it("always returns a valid grade letter", () => {
    const valid = new Set(["A", "B", "C", "D", "F"]);
    for (let s = 0; s <= 100; s++) {
      assert.ok(valid.has(computeGrade(s)), `invalid grade for score ${s}: ${computeGrade(s)}`);
    }
  });
});

describe("sparkline", () => {
  it("returns empty string for empty array", () => {
    assert.equal(sparkline([]), "");
  });

  it("returns empty string for null/undefined", () => {
    assert.equal(sparkline(null), "");
    assert.equal(sparkline(undefined), "");
  });

  it("returns a string of the same length as input", () => {
    assert.equal(sparkline([10, 20, 30, 40, 50]).length, 5);
  });

  it("returns single character for single-element array", () => {
    assert.equal(sparkline([42]).length, 1);
  });

  it("uses block characters from unicode range U+2581-U+2588", () => {
    const result = sparkline([0, 50, 100]);
    for (const ch of result) {
      const code = ch.codePointAt(0);
      assert.ok(code >= 0x2581 && code <= 0x2588, `char ${ch} not a block element`);
    }
  });
});

describe("computeTrend", () => {
  it("returns null for empty array", () => {
    assert.equal(computeTrend([]), null);
  });

  it("returns null for single-element array", () => {
    assert.equal(computeTrend([50]), null);
  });

  it("returns null for null input", () => {
    assert.equal(computeTrend(null), null);
  });

  it("returns improving when last value is much higher than first", () => {
    const r = computeTrend([10, 20, 30, 40, 80]);
    assert.equal(r.direction, "improving");
    assert.ok(r.delta > 0);
  });

  it("returns declining when last value is much lower than first", () => {
    const r = computeTrend([80, 70, 60, 50, 10]);
    assert.equal(r.direction, "declining");
    assert.ok(r.delta < 0);
  });

  it("returns stable when values are nearly constant", () => {
    const r = computeTrend([50, 51, 50, 51, 50]);
    assert.equal(r.direction, "stable");
  });

  it("returns object with direction, delta, deltaPercent, sparkline", () => {
    const r = computeTrend([40, 60, 80]);
    assert.ok(r !== null);
    assert.ok("direction" in r && "delta" in r && "deltaPercent" in r && "sparkline" in r);
  });

  it("handles delta from zero without division by zero", () => {
    const r = computeTrend([0, 0, 50]);
    assert.ok(r !== null);
    assert.ok(typeof r.deltaPercent === "number");
  });
});

describe("compositeScore", () => {
  const weights = { "Code Quality": 0.5, Security: 0.5 };

  it("returns score=100 and grade=A when all categories score 100", () => {
    const cats = { "Code Quality": { score: 100 }, Security: { score: 100 } };
    const r = compositeScore(cats, weights);
    assert.equal(r.score, 100);
    assert.equal(r.grade, "A");
  });

  it("returns score=0 when all categories have no_data", () => {
    const cats = {
      "Code Quality": { score: 50, no_data: true },
      Security: { score: 50, no_data: true },
    };
    assert.equal(compositeScore(cats, weights).score, 0);
  });

  it("computes weighted average correctly", () => {
    const cats = { "Code Quality": { score: 80 }, Security: { score: 60 } };
    assert.equal(compositeScore(cats, weights).score, 70);
  });

  it("skips categories not in weights", () => {
    const cats = { "Code Quality": { score: 90 }, Unknown: { score: 10 } };
    assert.equal(compositeScore(cats, { "Code Quality": 1 }).score, 90);
  });

  it("includes breakdown for each counted category", () => {
    const cats = { "Code Quality": { score: 80 }, Security: { score: 60 } };
    const r = compositeScore(cats, weights);
    assert.ok("Code Quality" in r.breakdown);
    assert.ok("Security" in r.breakdown);
  });

  it("returns score in [0, 100] for arbitrary inputs", () => {
    const cats = { "Code Quality": { score: 55 }, Security: { score: 72 } };
    const r = compositeScore(cats, weights);
    assert.ok(r.score >= 0 && r.score <= 100);
  });
});
