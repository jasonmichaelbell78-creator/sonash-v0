import assert from "node:assert/strict"
import { test, describe } from "node:test"
import { RateLimiter, type RateLimitConfig } from "../../lib/utils/rate-limiter"

describe("RateLimiter", () => {
  test("allows requests within limit", () => {
    const limiter = new RateLimiter({ maxCalls: 3, windowMs: 1000 })

    assert.ok(limiter.canMakeRequest(), "First request should be allowed")
    assert.ok(limiter.canMakeRequest(), "Second request should be allowed")
    assert.ok(limiter.canMakeRequest(), "Third request should be allowed")
  })

  test("blocks requests exceeding limit", () => {
    const limiter = new RateLimiter({ maxCalls: 2, windowMs: 1000 })

    assert.ok(limiter.canMakeRequest(), "First request allowed")
    assert.ok(limiter.canMakeRequest(), "Second request allowed")
    assert.equal(limiter.canMakeRequest(), false, "Third request should be blocked")
    assert.equal(limiter.canMakeRequest(), false, "Fourth request should be blocked")
  })

  test("allows requests after time window expires", async () => {
    const limiter = new RateLimiter({ maxCalls: 2, windowMs: 50 }) // 50ms window

    // Use up the limit
    assert.ok(limiter.canMakeRequest())
    assert.ok(limiter.canMakeRequest())
    assert.equal(limiter.canMakeRequest(), false)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60))

    // Should allow requests again
    assert.ok(limiter.canMakeRequest(), "Should allow request after window expires")
  })

  test("getTimeUntilNextRequest returns 0 when request allowed", () => {
    const limiter = new RateLimiter({ maxCalls: 2, windowMs: 1000 })

    const timeUntil = limiter.getTimeUntilNextRequest()
    assert.equal(timeUntil, 0, "Should return 0 when requests are allowed")
  })

  test("getTimeUntilNextRequest returns positive value when blocked", () => {
    const limiter = new RateLimiter({ maxCalls: 1, windowMs: 1000 })

    limiter.canMakeRequest() // Use up the limit

    const timeUntil = limiter.getTimeUntilNextRequest()
    assert.ok(timeUntil > 0, "Should return positive value when blocked")
    assert.ok(timeUntil <= 1000, "Should be within the window duration")
  })

  test("getTimeUntilNextRequest decreases over time", async () => {
    const limiter = new RateLimiter({ maxCalls: 1, windowMs: 1000 })

    limiter.canMakeRequest() // Use up the limit

    const timeUntil1 = limiter.getTimeUntilNextRequest()
    await new Promise(resolve => setTimeout(resolve, 20))
    const timeUntil2 = limiter.getTimeUntilNextRequest()

    assert.ok(timeUntil2 < timeUntil1, "Time until next request should decrease")
  })

  test("reset clears all tracked calls", () => {
    const limiter = new RateLimiter({ maxCalls: 1, windowMs: 1000 })

    limiter.canMakeRequest() // Use up the limit
    assert.equal(limiter.canMakeRequest(), false, "Should be blocked")

    limiter.reset()

    assert.ok(limiter.canMakeRequest(), "Should allow request after reset")
  })

  test("handles rapid successive calls correctly", () => {
    const limiter = new RateLimiter({ maxCalls: 5, windowMs: 1000 })

    let allowedCount = 0
    for (let i = 0; i < 10; i++) {
      if (limiter.canMakeRequest()) {
        allowedCount++
      }
    }

    assert.equal(allowedCount, 5, "Should allow exactly maxCalls requests")
  })

  test("sliding window behavior", async () => {
    const limiter = new RateLimiter({ maxCalls: 2, windowMs: 100 })

    // Use up limit
    assert.ok(limiter.canMakeRequest())
    assert.ok(limiter.canMakeRequest())
    assert.equal(limiter.canMakeRequest(), false)

    // Wait for window to completely expire (110ms to account for timing variations)
    await new Promise(resolve => setTimeout(resolve, 110))

    // Window should have expired, allowing requests again
    assert.ok(limiter.canMakeRequest(), "Requests should be allowed after window expires")
    assert.ok(limiter.canMakeRequest(), "Second request should be allowed")

    // But limit should still apply for third request
    assert.equal(limiter.canMakeRequest(), false, "Limit should still apply")
  })

  test("zero maxCalls blocks all requests", () => {
    const limiter = new RateLimiter({ maxCalls: 0, windowMs: 1000 })

    assert.equal(limiter.canMakeRequest(), false, "Should block all requests with maxCalls=0")
  })

  test("very large windowMs maintains limit", () => {
    const limiter = new RateLimiter({ maxCalls: 2, windowMs: 100000 }) // 100 seconds

    assert.ok(limiter.canMakeRequest())
    assert.ok(limiter.canMakeRequest())
    assert.equal(limiter.canMakeRequest(), false)

    // Time until next should be large
    const timeUntil = limiter.getTimeUntilNextRequest()
    assert.ok(timeUntil > 90000, "Should have long wait time with large window")
  })
})
