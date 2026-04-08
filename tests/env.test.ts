import { describe, expect, it, vi } from "vitest"

describe("env validation", () => {
  it("accepts a minimal development environment", async () => {
    vi.resetModules()
    vi.stubEnv("NODE_ENV", "development")

    const { env } = await import("@/lib/env")

    expect(env.NODE_ENV).toBe("development")

    vi.unstubAllEnvs()
  })
})