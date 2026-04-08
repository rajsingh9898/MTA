import { describe, expect, it } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

describe("checkRateLimit", () => {
  it("allows requests until the limit is reached", () => {
    const key = `test-${Date.now()}`

    const first = checkRateLimit(key, 2, 60_000)
    const second = checkRateLimit(key, 2, 60_000)
    const third = checkRateLimit(key, 2, 60_000)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
  })
})