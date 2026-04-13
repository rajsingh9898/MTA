import { env } from "@/lib/env"
import { createLogger } from "@/lib/logger"
import { generateItineraryWithOpenAI } from "@/lib/openai"

const logger = createLogger("weather")

const WEATHER_BASE = "https://api.openweathermap.org/data/2.5"
const GEO_BASE = "https://api.openweathermap.org/geo/1.0"

const DAY_MS = 24 * 60 * 60 * 1000
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000
const WEATHER_CACHE_VERSION = "v2"

type CachedWeather = {
  expiresAt: number
  payload: WeatherInsights
}

const globalForWeatherCache = globalThis as unknown as {
  __weatherInsightsCache?: Map<string, CachedWeather>
}

const weatherCache =
  globalForWeatherCache.__weatherInsightsCache ??
  (globalForWeatherCache.__weatherInsightsCache = new Map<string, CachedWeather>())

export interface DailyWeather {
  date: string
  condition: string
  description: string
  minTempC: number
  maxTempC: number
  humidity: number
  windSpeedKph: number
  precipitationChance: number
  feelsLikeC: number
}

export interface CurrentWeather {
  observedAt: string
  condition: string
  description: string
  temperatureC: number
  feelsLikeC: number
  humidity: number
  windSpeedKph: number
}

export interface BestTimeRecommendation {
  months: string[]
  summary: string
  travelScore: "GOOD" | "MIXED" | "CHALLENGING"
}

export interface HealthInsights {
  aqi: number | null
  aqiLevel: "GOOD" | "FAIR" | "MODERATE" | "POOR" | "VERY_POOR" | null
  uvIndex: number | null
  pollenIndex: number | null
  airQualitySource: "IQAIR" | "OPENWEATHER" | "NONE"
  healthTips: string[]
}

export interface ActivityRecommendation {
  title: string
  type: "INDOOR" | "OUTDOOR" | "FLEX"
  reason: string
}

export interface WeatherInsights {
  destination: string
  location: {
    name: string
    country?: string
    lat: number
    lon: number
  }
  current: CurrentWeather
  forecast: DailyWeather[]
  packingSuggestions: string[]
  bestTimeToVisit: BestTimeRecommendation
  health: HealthInsights
  activityRecommendations: ActivityRecommendation[]
  generatedAt: string
}

type OpenWeatherForecastItem = {
  dt: number
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    humidity: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
  pop?: number
}

function normalizeInsightsPayload(payload: WeatherInsights): WeatherInsights {
  return {
    ...payload,
    health: payload.health ?? {
      aqi: null,
      aqiLevel: null,
      uvIndex: null,
      pollenIndex: null,
      airQualitySource: "NONE",
      healthTips: ["Conditions look balanced; follow standard day-trip precautions"],
    },
    activityRecommendations:
      payload.activityRecommendations ?? [
        {
          title: "Mixed city day plan",
          type: "FLEX",
          reason: "Moderate conditions support combining indoor attractions and outdoor sightseeing.",
        },
      ],
  }
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function monthName(index: number): string {
  return new Date(2026, index, 1).toLocaleString("en-US", { month: "long" })
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function stableRound(value: number): number {
  return Math.round(value * 10) / 10
}

function isSevereCondition(condition: string): boolean {
  const lower = condition.toLowerCase()
  return (
    lower.includes("thunderstorm") ||
    lower.includes("extreme") ||
    lower.includes("squall") ||
    lower.includes("tornado")
  )
}

function mapAqiLevel(aqi: number | null): HealthInsights["aqiLevel"] {
  if (!aqi) return null
  if (aqi === 1) return "GOOD"
  if (aqi === 2) return "FAIR"
  if (aqi === 3) return "MODERATE"
  if (aqi === 4) return "POOR"
  return "VERY_POOR"
}

function mapUsAqiToFivePointScale(usAqi: number | null): number | null {
  if (usAqi === null) return null
  if (usAqi <= 50) return 1
  if (usAqi <= 100) return 2
  if (usAqi <= 150) return 3
  if (usAqi <= 200) return 4
  return 5
}

function buildHealthTips(args: {
  aqiLevel: HealthInsights["aqiLevel"]
  uvIndex: number | null
  pollenIndex: number | null
  maxTempC: number
  minTempC: number
}): string[] {
  const tips = new Set<string>()

  if (args.uvIndex !== null && args.uvIndex >= 6) {
    tips.add("Use SPF 30+ sunscreen and a cap during midday hours")
  }

  if (args.uvIndex !== null && args.uvIndex >= 8) {
    tips.add("Limit direct sun exposure between 11 AM and 3 PM")
  }

  if (args.aqiLevel === "MODERATE" || args.aqiLevel === "POOR" || args.aqiLevel === "VERY_POOR") {
    tips.add("Carry a lightweight mask for high-traffic outdoor areas")
  }

  if (args.aqiLevel === "POOR" || args.aqiLevel === "VERY_POOR") {
    tips.add("Prefer indoor attractions during peak pollution periods")
  }

  if (args.pollenIndex !== null && args.pollenIndex >= 3) {
    tips.add("If you have allergies, carry antihistamines and sunglasses")
  }

  if (args.pollenIndex !== null && args.pollenIndex >= 4) {
    tips.add("Limit time in parks during early morning when pollen is higher")
  }

  if (args.maxTempC >= 30) {
    tips.add("Hydrate frequently and schedule breaks in shade")
  }

  if (args.minTempC <= 10) {
    tips.add("Layer clothing to adapt to cool mornings and evenings")
  }

  if (tips.size === 0) {
    tips.add("Conditions look balanced; follow standard day-trip precautions")
  }

  return Array.from(tips).slice(0, 4)
}

function buildActivityRecommendations(current: CurrentWeather, forecast: DailyWeather[]): ActivityRecommendation[] {
  const recommendations: ActivityRecommendation[] = []
  const avgRain = forecast.reduce((sum, day) => sum + day.precipitationChance, 0) / Math.max(forecast.length, 1)
  const rainy = avgRain >= 0.45 || current.condition.toLowerCase().includes("rain")
  const windy = current.windSpeedKph >= 30
  const hot = current.temperatureC >= 30
  const cold = current.temperatureC <= 10

  if (rainy) {
    recommendations.push({
      title: "Museums, galleries, and local food tours",
      type: "INDOOR",
      reason: "Higher rain probability makes indoor cultural stops more reliable.",
    })
  } else {
    recommendations.push({
      title: "Walking tours and landmark photography",
      type: "OUTDOOR",
      reason: "Lower rain odds and stable conditions suit outdoor exploration.",
    })
  }

  if (hot) {
    recommendations.push({
      title: "Early-morning parks and evening waterfront walks",
      type: "OUTDOOR",
      reason: "Warm daytime temperatures are better managed outside peak sun hours.",
    })
  } else if (cold || windy) {
    recommendations.push({
      title: "Cafe hopping and covered heritage sites",
      type: "FLEX",
      reason: "Cool or windy conditions favor shorter outdoor segments with indoor breaks.",
    })
  } else {
    recommendations.push({
      title: "Mixed city day plan",
      type: "FLEX",
      reason: "Moderate conditions support combining indoor attractions and outdoor sightseeing.",
    })
  }

  recommendations.push({
    title: "Local market exploration",
    type: "FLEX",
    reason: "Works in most conditions and can be adjusted around short weather changes.",
  })

  return recommendations.slice(0, 3)
}

async function fetchAirQuality(lat: number, lon: number, apiKey: string): Promise<{ aqi: number | null }> {
  try {
    const response = await fetch(
      `${WEATHER_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      { next: { revalidate: 900 } }
    )

    if (!response.ok) {
      return { aqi: null }
    }

    const data = (await response.json()) as {
      list?: Array<{ main?: { aqi?: number } }>
    }

    return { aqi: data.list?.[0]?.main?.aqi ?? null }
  } catch {
    return { aqi: null }
  }
}

async function fetchUvIndex(lat: number, lon: number, apiKey: string): Promise<{ uvIndex: number | null }> {
  try {
    const response = await fetch(
      `${WEATHER_BASE}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`,
      { next: { revalidate: 900 } }
    )

    if (!response.ok) {
      return { uvIndex: null }
    }

    const data = (await response.json()) as {
      current?: { uvi?: number }
    }

    const uvi = data.current?.uvi
    return { uvIndex: typeof uvi === "number" ? stableRound(uvi) : null }
  } catch {
    return { uvIndex: null }
  }
}

async function fetchIqAirAqi(lat: number, lon: number, apiKey?: string): Promise<{ aqi: number | null }> {
  if (!apiKey) return { aqi: null }

  try {
    const response = await fetch(
      `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${apiKey}`,
      { next: { revalidate: 900 } }
    )

    if (!response.ok) {
      return { aqi: null }
    }

    const data = (await response.json()) as {
      data?: { current?: { pollution?: { aqius?: number } } }
    }

    const raw = data.data?.current?.pollution?.aqius
    const normalized = typeof raw === "number" ? mapUsAqiToFivePointScale(raw) : null
    return { aqi: normalized }
  } catch {
    return { aqi: null }
  }
}

async function fetchGooglePollenIndex(lat: number, lon: number, apiKey?: string): Promise<{ pollenIndex: number | null }> {
  if (!apiKey) return { pollenIndex: null }

  try {
    const url =
      `https://pollen.googleapis.com/v1/forecast:lookup` +
      `?location.latitude=${lat}&location.longitude=${lon}&days=1&key=${apiKey}`

    const response = await fetch(url, { next: { revalidate: 900 } })
    if (!response.ok) {
      return { pollenIndex: null }
    }

    const data = (await response.json()) as {
      dailyInfo?: Array<{
        indexes?: Array<{ value?: number; indexInfo?: { value?: number } }>
      }>
    }

    const indexes = data.dailyInfo?.[0]?.indexes ?? []
    const values = indexes
      .map((idx) => idx.indexInfo?.value ?? idx.value)
      .filter((v): v is number => typeof v === "number")

    if (values.length === 0) {
      return { pollenIndex: null }
    }

    const maxValue = Math.max(...values)
    return { pollenIndex: stableRound(clamp(maxValue, 0, 5)) }
  } catch {
    return { pollenIndex: null }
  }
}

function buildPackingSuggestions(current: CurrentWeather, forecast: DailyWeather[]): string[] {
  const suggestions = new Set<string>()
  const all = [
    {
      minTempC: current.temperatureC,
      maxTempC: current.temperatureC,
      precipitationChance: 0,
      humidity: current.humidity,
      windSpeedKph: current.windSpeedKph,
      condition: current.condition,
    },
    ...forecast,
  ]

  const minTemp = Math.min(...all.map((d) => d.minTempC))
  const maxTemp = Math.max(...all.map((d) => d.maxTempC))
  const maxRainChance = Math.max(...all.map((d) => d.precipitationChance))
  const maxWind = Math.max(...all.map((d) => d.windSpeedKph))
  const avgHumidity = all.reduce((sum, d) => sum + d.humidity, 0) / all.length
  const severeDay = all.find((d) => isSevereCondition(d.condition))

  if (maxTemp >= 30) {
    suggestions.add("Lightweight breathable clothing")
    suggestions.add("Sunscreen (SPF 30+) and sunglasses")
  }

  if (minTemp <= 12) {
    suggestions.add("Warm jacket or layered clothing")
  }

  if (maxRainChance >= 0.4 || severeDay) {
    suggestions.add("Compact umbrella or waterproof jacket")
    suggestions.add("Water-resistant footwear")
  }

  if (maxWind >= 25) {
    suggestions.add("Windproof outer layer")
  }

  if (avgHumidity >= 70) {
    suggestions.add("Moisture-wicking outfits")
  }

  if (maxTemp - minTemp >= 10) {
    suggestions.add("Layered outfits for changing temperatures")
  }

  suggestions.add("Comfortable walking shoes")
  suggestions.add("Reusable water bottle")

  return Array.from(suggestions).slice(0, 8)
}

function inferBestMonths(lat: number): string[] {
  const absLat = Math.abs(lat)

  if (absLat < 23) {
    return ["November", "December", "January", "February"]
  }

  if (lat >= 0) {
    return ["April", "May", "September", "October"]
  }

  return ["October", "November", "March", "April"]
}

function buildDeterministicBestTime(current: CurrentWeather, lat: number): BestTimeRecommendation {
  const months = inferBestMonths(lat)
  const comfortTemp = current.temperatureC >= 16 && current.temperatureC <= 30
  const windy = current.windSpeedKph > 30
  const humid = current.humidity > 80

  const travelScore: BestTimeRecommendation["travelScore"] =
    comfortTemp && !windy && !humid ? "GOOD" : comfortTemp ? "MIXED" : "CHALLENGING"

  const summary =
    travelScore === "GOOD"
      ? `Current conditions are generally comfortable. Top months are ${months.join(", ")}.`
      : travelScore === "MIXED"
        ? `Current conditions are manageable with preparation. Better months are ${months.join(", ")}.`
        : `Current conditions may be challenging. For smoother travel, target ${months.join(", ")}.`

  return { months, summary, travelScore }
}

async function maybeGenerateAIBestTimeSummary(args: {
  destination: string
  current: CurrentWeather
  forecast: DailyWeather[]
  deterministic: BestTimeRecommendation
}): Promise<BestTimeRecommendation> {
  if (!env.OPENAI_API_KEY) {
    return args.deterministic
  }

  const systemPrompt =
    "You are a travel climate advisor. Return strict JSON with keys: summary (string), months (string array), travelScore ('GOOD'|'MIXED'|'CHALLENGING')."

  const userPrompt = JSON.stringify({
    destination: args.destination,
    current: args.current,
    forecast: args.forecast.slice(0, 7),
    deterministic: args.deterministic,
    instruction:
      "Give concise best-time-to-visit guidance for regular travelers. Keep summary under 220 characters.",
  })

  try {
    const response = await generateItineraryWithOpenAI(userPrompt, systemPrompt)
    if (!response) return args.deterministic

    const parsed = JSON.parse(response) as {
      summary?: string
      months?: string[]
      travelScore?: "GOOD" | "MIXED" | "CHALLENGING"
    }

    if (!parsed.summary || !Array.isArray(parsed.months) || parsed.months.length === 0) {
      return args.deterministic
    }

    const safeScore =
      parsed.travelScore === "GOOD" || parsed.travelScore === "MIXED" || parsed.travelScore === "CHALLENGING"
        ? parsed.travelScore
        : args.deterministic.travelScore

    return {
      summary: parsed.summary,
      months: parsed.months.slice(0, 6),
      travelScore: safeScore,
    }
  } catch {
    logger.warn("AI best-time summary failed, using deterministic fallback")
    return args.deterministic
  }
}

function summarizeDailyForecast(entries: OpenWeatherForecastItem[], startDate?: string, endDate?: string): DailyWeather[] {
  const now = Date.now()
  const startMs = startDate ? new Date(startDate).getTime() : now
  const endMs = endDate ? new Date(endDate).getTime() : startMs + 4 * DAY_MS

  const selected = entries.filter((entry) => {
    const ts = entry.dt * 1000
    return ts >= startMs && ts <= endMs + DAY_MS
  })

  const source = selected.length > 0 ? selected : entries
  const grouped = new Map<string, OpenWeatherForecastItem[]>()

  for (const item of source) {
    const key = toIsoDate(item.dt * 1000)
    const arr = grouped.get(key) ?? []
    arr.push(item)
    grouped.set(key, arr)
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 7)
    .map(([date, dayEntries]) => {
      const minTemp = Math.min(...dayEntries.map((d) => d.main.temp_min))
      const maxTemp = Math.max(...dayEntries.map((d) => d.main.temp_max))
      const avgHumidity = dayEntries.reduce((sum, d) => sum + d.main.humidity, 0) / dayEntries.length
      const avgWind = dayEntries.reduce((sum, d) => sum + d.wind.speed, 0) / dayEntries.length
      const avgFeel = dayEntries.reduce((sum, d) => sum + d.main.feels_like, 0) / dayEntries.length
      const maxPop = Math.max(...dayEntries.map((d) => d.pop ?? 0))

      const byCondition = dayEntries.reduce<Record<string, number>>((acc, d) => {
        const key = d.weather[0]?.main ?? "Clear"
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})

      const topCondition = Object.entries(byCondition).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Clear"
      const representative = dayEntries.find((d) => d.weather[0]?.main === topCondition) ?? dayEntries[0]

      return {
        date,
        condition: topCondition,
        description: representative.weather[0]?.description ?? "clear sky",
        minTempC: stableRound(minTemp),
        maxTempC: stableRound(maxTemp),
        humidity: Math.round(avgHumidity),
        windSpeedKph: stableRound(avgWind * 3.6),
        precipitationChance: stableRound(clamp(maxPop, 0, 1)),
        feelsLikeC: stableRound(avgFeel),
      }
    })
}

async function geocodeDestination(destination: string): Promise<{ name: string; country?: string; lat: number; lon: number }> {
  const apiKey = env.OPENWEATHER_API_KEY
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set")
  }

  const url = `${GEO_BASE}/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`
  const response = await fetch(url, { next: { revalidate: 1800 } })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Geocoding failed (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as Array<{ name: string; country?: string; lat: number; lon: number }>
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Destination not found in weather provider")
  }

  return data[0]
}

export async function getWeatherInsights(args: {
  destination: string
  startDate?: string
  endDate?: string
  includeAiSummary?: boolean
}): Promise<WeatherInsights> {
  const destination = args.destination.trim()
  const cacheKey = `${WEATHER_CACHE_VERSION}::${destination}::${args.startDate ?? "none"}::${args.endDate ?? "none"}::${args.includeAiSummary ? "ai" : "plain"}`
  const cached = weatherCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return normalizeInsightsPayload(cached.payload)
  }

  const geo = await geocodeDestination(destination)
  const apiKey = env.OPENWEATHER_API_KEY
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set")
  }

  const [currentRes, forecastRes, airQuality, uvInfo, iqAir, pollen] = await Promise.all([
    fetch(
      `${WEATHER_BASE}/weather?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 900 } }
    ),
    fetch(
      `${WEATHER_BASE}/forecast?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 900 } }
    ),
    fetchAirQuality(geo.lat, geo.lon, apiKey),
    fetchUvIndex(geo.lat, geo.lon, apiKey),
    fetchIqAirAqi(geo.lat, geo.lon, env.IQAIR_API_KEY),
    fetchGooglePollenIndex(geo.lat, geo.lon, env.GOOGLE_POLLEN_API_KEY),
  ])

  if (!currentRes.ok) {
    throw new Error(`Current weather fetch failed with status ${currentRes.status}`)
  }

  if (!forecastRes.ok) {
    throw new Error(`Forecast fetch failed with status ${forecastRes.status}`)
  }

  const currentData = await currentRes.json()
  const forecastData = (await forecastRes.json()) as { list?: OpenWeatherForecastItem[] }

  const current: CurrentWeather = {
    observedAt: new Date((currentData.dt ?? Date.now() / 1000) * 1000).toISOString(),
    condition: currentData.weather?.[0]?.main ?? "Clear",
    description: currentData.weather?.[0]?.description ?? "clear sky",
    temperatureC: stableRound(currentData.main?.temp ?? 0),
    feelsLikeC: stableRound(currentData.main?.feels_like ?? 0),
    humidity: Math.round(currentData.main?.humidity ?? 0),
    windSpeedKph: stableRound((currentData.wind?.speed ?? 0) * 3.6),
  }

  const forecast = summarizeDailyForecast(forecastData.list ?? [], args.startDate, args.endDate)
  const packingSuggestions = buildPackingSuggestions(current, forecast)
  const resolvedAqi = iqAir.aqi ?? airQuality.aqi
  const aqiLevel = mapAqiLevel(resolvedAqi)
  const airQualitySource: HealthInsights["airQualitySource"] = iqAir.aqi !== null ? "IQAIR" : airQuality.aqi !== null ? "OPENWEATHER" : "NONE"
  const maxTempC = Math.max(current.temperatureC, ...forecast.map((day) => day.maxTempC))
  const minTempC = Math.min(current.temperatureC, ...forecast.map((day) => day.minTempC))
  const health: HealthInsights = {
    aqi: resolvedAqi,
    aqiLevel,
    uvIndex: uvInfo.uvIndex,
    pollenIndex: pollen.pollenIndex,
    airQualitySource,
    healthTips: buildHealthTips({
      aqiLevel,
      uvIndex: uvInfo.uvIndex,
      pollenIndex: pollen.pollenIndex,
      maxTempC,
      minTempC,
    }),
  }
  const activityRecommendations = buildActivityRecommendations(current, forecast)
  const deterministic = buildDeterministicBestTime(current, geo.lat)
  const bestTimeToVisit = args.includeAiSummary
    ? await maybeGenerateAIBestTimeSummary({ destination, current, forecast, deterministic })
    : deterministic

  const payload: WeatherInsights = {
    destination,
    location: {
      name: geo.name,
      country: geo.country,
      lat: geo.lat,
      lon: geo.lon,
    },
    current,
    forecast,
    packingSuggestions,
    health,
    activityRecommendations,
    bestTimeToVisit,
    generatedAt: new Date().toISOString(),
  }

  const normalizedPayload = normalizeInsightsPayload(payload)

  weatherCache.set(cacheKey, {
    expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
    payload: normalizedPayload,
  })

  return normalizedPayload
}

export function hasSevereWeather(forecast: DailyWeather[]): boolean {
  return forecast.some((day) => {
    return (
      isSevereCondition(day.condition) ||
      day.precipitationChance >= 0.75 ||
      day.windSpeedKph >= 40
    )
  })
}

export function summarizeSevereWeather(forecast: DailyWeather[]): string {
  const severeDay = forecast.find((day) => {
    return (
      isSevereCondition(day.condition) ||
      day.precipitationChance >= 0.75 ||
      day.windSpeedKph >= 40
    )
  })

  if (!severeDay) {
    return "No severe weather is currently forecasted."
  }

  return `${severeDay.date}: ${severeDay.condition.toLowerCase()}, ${severeDay.minTempC}-${severeDay.maxTempC}C, rain ${Math.round(
    severeDay.precipitationChance * 100
  )}%`
}

export function suggestBestVisitWindow(lat: number): string[] {
  const months = inferBestMonths(lat)
  const monthIndexes = months
    .map((m) => new Date(`${m} 1, 2026`).getMonth())
    .filter((idx) => Number.isFinite(idx))

  if (monthIndexes.length === 0) {
    return months
  }

  return monthIndexes.map((idx) => monthName(idx))
}