import { NextResponse } from "next/server"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"
import { weatherRequestSchema, weatherResponseSchema } from "@/lib/schemas"
import { getWeatherInsights } from "@/lib/weather"

const logger = createLogger("weather-api")

function normalizeWeatherResponse(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload
  }

  const base = payload as Record<string, unknown>

  return {
    ...base,
    health:
      base.health && typeof base.health === "object"
        ? base.health
        : {
            aqi: null,
            aqiLevel: null,
            uvIndex: null,
            healthTips: ["Conditions look balanced; follow standard day-trip precautions"],
          },
    activityRecommendations: Array.isArray(base.activityRecommendations)
      ? base.activityRecommendations
      : [
          {
            title: "Mixed city day plan",
            type: "FLEX",
            reason: "Moderate conditions support combining indoor attractions and outdoor sightseeing.",
          },
        ],
  }
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(getRateLimitKey(request, "weather"), 60, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)

    const parsed = weatherRequestSchema.safeParse({
      destination: searchParams.get("destination") ?? "",
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      includeAiSummary: searchParams.get("includeAiSummary") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid weather request", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const payload = await getWeatherInsights({
      destination: parsed.data.destination,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      includeAiSummary: parsed.data.includeAiSummary ?? true,
    })

    const normalized = weatherResponseSchema.safeParse(normalizeWeatherResponse(payload))
    if (!normalized.success) {
      logger.error("Weather response schema validation failed", normalized.error.issues)
      return NextResponse.json({ error: "Weather payload validation failed" }, { status: 500 })
    }

    return NextResponse.json({ weather: normalized.data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown weather API error"
    logger.error("Failed to fetch weather", message)

    if (message.includes("OPENWEATHER_API_KEY")) {
      return NextResponse.json(
        { error: "Weather service is not configured yet. Add OPENWEATHER_API_KEY." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
