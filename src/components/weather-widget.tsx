"use client"

import { useEffect, useMemo, useState } from "react"
import { Cloud, CloudRain, Loader2, Thermometer, Umbrella, Wind } from "lucide-react"

type WeatherPayload = {
  destination: string
  current: {
    condition: string
    description: string
    temperatureC: number
    feelsLikeC: number
    humidity: number
    windSpeedKph: number
  }
  forecast: Array<{
    date: string
    condition: string
    minTempC: number
    maxTempC: number
    precipitationChance: number
  }>
  packingSuggestions: string[]
  health: {
    aqi: number | null
    aqiLevel: "GOOD" | "FAIR" | "MODERATE" | "POOR" | "VERY_POOR" | null
    uvIndex: number | null
    pollenIndex: number | null
    airQualitySource: "IQAIR" | "OPENWEATHER" | "NONE"
    healthTips: string[]
  }
  activityRecommendations: Array<{
    title: string
    type: "INDOOR" | "OUTDOOR" | "FLEX"
    reason: string
  }>
  bestTimeToVisit: {
    months: string[]
    summary: string
    travelScore: "GOOD" | "MIXED" | "CHALLENGING"
  }
}

function aqiBadgeClasses(level: WeatherPayload["health"]["aqiLevel"]): string {
  if (level === "GOOD") return "bg-green-500/15 text-green-700 border-green-500/30"
  if (level === "FAIR") return "bg-lime-500/15 text-lime-700 border-lime-500/30"
  if (level === "MODERATE") return "bg-amber-500/15 text-amber-700 border-amber-500/30"
  if (level === "POOR") return "bg-orange-500/15 text-orange-700 border-orange-500/30"
  if (level === "VERY_POOR") return "bg-red-500/15 text-red-700 border-red-500/30"
  return "bg-muted text-muted-foreground border-border"
}

function scoreClasses(score: WeatherPayload["bestTimeToVisit"]["travelScore"]): string {
  if (score === "GOOD") return "bg-green-500/15 text-green-700 border-green-500/30"
  if (score === "MIXED") return "bg-amber-500/15 text-amber-700 border-amber-500/30"
  return "bg-red-500/15 text-red-700 border-red-500/30"
}

export function WeatherWidget({
  destination,
  startDate,
  endDate,
}: {
  destination: string
  startDate?: string | Date | null
  endDate?: string | Date | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherPayload | null>(null)

  const tripDates = useMemo(() => {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    const startValid = Boolean(start && !Number.isNaN(start.getTime()))
    const endValid = Boolean(end && !Number.isNaN(end.getTime()))

    if (!startValid && !endValid) {
      return { start: null as Date | null, end: null as Date | null }
    }

    return {
      start: startValid ? (start as Date) : null,
      end: endValid ? (end as Date) : null,
    }
  }, [startDate, endDate])

  const tripStatus = useMemo(() => {
    if (!tripDates.start) return "no-dates"

    const now = new Date()
    const startDay = new Date(tripDates.start)
    const nowDay = new Date(now)
    startDay.setHours(0, 0, 0, 0)
    nowDay.setHours(0, 0, 0, 0)

    const diffDaysToStart = Math.floor(
      (startDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDaysToStart > 30) return "far-future"   // trip > 30 days away
    if (diffDaysToStart >= 0) return "upcoming"     // trip starting within 30 days
    // trip started in the past — check if still ongoing
    if (tripDates.end) {
      const endDay = new Date(tripDates.end)
      endDay.setHours(0, 0, 0, 0)
      if (endDay >= nowDay) return "ongoing"         // currently on the trip
    }
    return "past"                                   // entire trip is in the past
  }, [tripDates.start, tripDates.end])

  const shouldUseTripRange = tripStatus === "upcoming" || tripStatus === "ongoing"

  const tripRangeLabel = useMemo(() => {
    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

    if (tripDates.start && tripDates.end) {
      return `${formatDate(tripDates.start)} - ${formatDate(tripDates.end)}`
    }

    if (tripDates.start) {
      return formatDate(tripDates.start)
    }

    return null
  }, [tripDates.end, tripDates.start])

  const params = useMemo(() => {
    const query = new URLSearchParams({ destination })

    if (shouldUseTripRange) {
      if (tripDates.start) query.set("startDate", tripDates.start.toISOString())
      if (tripDates.end) query.set("endDate", tripDates.end.toISOString())
    }

    query.set("includeAiSummary", "true")
    return query
  }, [destination, shouldUseTripRange, tripDates.end, tripDates.start])

  useEffect(() => {
    if (!destination) return

    let isMounted = true

    fetch(`/api/weather?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Unable to fetch weather")
        }
        return res.json() as Promise<{ weather: WeatherPayload }>
      })
      .then((data) => {
        if (isMounted) {
          setWeather(data.weather)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to fetch weather")
        }
      })

    return () => {
      isMounted = false
    }
  }, [destination, params])

  // ── Compute which forecast days to show ─────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const visibleForecast = useMemo(() => {
    if (!weather) return []

    const todayMs = today.getTime()

    if (tripStatus === "far-future") {
      // Only show today's weather (first day >= today)
      return weather.forecast.filter((d) => {
        const dayMs = new Date(d.date).setHours(0, 0, 0, 0)
        return dayMs >= todayMs
      }).slice(0, 1)
    }

    if (tripStatus === "past") {
      // Trip already ended — show from today onwards (up to 4 days)
      return weather.forecast.filter((d) => {
        const dayMs = new Date(d.date).setHours(0, 0, 0, 0)
        return dayMs >= todayMs
      }).slice(0, 4)
    }

    if (tripStatus === "ongoing") {
      // Show from today through the end of the trip
      const endMs = tripDates.end ? new Date(tripDates.end).setHours(0, 0, 0, 0) : Infinity
      return weather.forecast.filter((d) => {
        const dayMs = new Date(d.date).setHours(0, 0, 0, 0)
        return dayMs >= todayMs && dayMs <= endMs
      }).slice(0, 4)
    }

    if (tripStatus === "upcoming") {
      // Show forecast days within the booked trip window
      const startMs = tripDates.start ? new Date(tripDates.start).setHours(0, 0, 0, 0) : todayMs
      const endMs = tripDates.end ? new Date(tripDates.end).setHours(0, 0, 0, 0) : Infinity
      return weather.forecast.filter((d) => {
        const dayMs = new Date(d.date).setHours(0, 0, 0, 0)
        return dayMs >= startMs && dayMs <= endMs
      }).slice(0, 4)
    }

    // Fallback — show up to 4 future days
    return weather.forecast.filter((d) => {
      const dayMs = new Date(d.date).setHours(0, 0, 0, 0)
      return dayMs >= todayMs
    }).slice(0, 4)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, tripStatus, tripDates.start, tripDates.end])

  const forecastLabel = useMemo(() => {
    if (tripStatus === "far-future") return "Today's weather (trip forecast available within 30 days)"
    if (tripStatus === "past") return "Current weather (trip has ended)"
    if (tripStatus === "ongoing") return "Current trip forecast"
    if (tripStatus === "upcoming") return `Trip forecast: ${tripRangeLabel ?? ""}`
    return "Forecast"
  }, [tripStatus, tripRangeLabel])
  // ────────────────────────────────────────────────────────────────────────────

  if (!weather && !error) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-5 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading weather intelligence...</p>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-primary" />
          <p className="label">Weather Intelligence</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {error || "Weather data is not available right now."}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4 text-primary" />
            <p className="label">Live Weather</p>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {weather.destination}: {weather.current.description}
          </p>
          {tripRangeLabel && (
            <p className="text-xs text-muted-foreground mt-1">
              Trip dates: {tripRangeLabel}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{Math.round(weather.current.temperatureC)}°C</p>
          <p className="text-xs text-muted-foreground">Feels like {Math.round(weather.current.feelsLikeC)}°C</p>
        </div>
      </div>

      {/* Forecast label */}
      <p className="text-xs text-muted-foreground -mb-1">{forecastLabel}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleForecast.length === 0 ? (
          <p className="col-span-4 text-sm text-muted-foreground">No forecast data available for the selected dates.</p>
        ) : (
          visibleForecast.map((day) => {
            const dayMs = new Date(day.date).setHours(0, 0, 0, 0)
            const isToday = dayMs === today.getTime()
            return (
              <div key={day.date} className={`rounded-xl border p-3 bg-secondary/20 ${
                isToday ? "border-primary/60 ring-1 ring-primary/30" : "border-border/60"
              }`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {isToday ? (
                    <span className="text-primary font-semibold">Today</span>
                  ) : (
                    new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  )}
                </p>
                <p className="text-sm font-semibold">{Math.round(day.maxTempC)}°C / {Math.round(day.minTempC)}°C</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{day.condition}</p>
                <p className="text-[11px] text-muted-foreground">Rain {Math.round(day.precipitationChance * 100)}%</p>
              </div>
            )
          })
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <Umbrella className="w-4 h-4 text-primary" />
            <p className="label">Packing Suggestions</p>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {weather.packingSuggestions.slice(0, 5).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-primary" />
            <p className="label">Best Time To Visit</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{weather.bestTimeToVisit.summary}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {weather.bestTimeToVisit.months.slice(0, 4).map((month) => (
              <span key={month} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {month}
              </span>
            ))}
          </div>
          <span className={`inline-flex text-xs px-2 py-1 rounded-full border ${scoreClasses(weather.bestTimeToVisit.travelScore)}`}>
            {weather.bestTimeToVisit.travelScore}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <p className="label">Health Snapshot</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex text-xs px-2 py-1 rounded-full border ${aqiBadgeClasses(weather.health.aqiLevel)}`}>
              AQI {weather.health.aqi ?? "N/A"} {weather.health.aqiLevel ? `(${weather.health.aqiLevel})` : ""}
            </span>
            <span className="inline-flex text-xs px-2 py-1 rounded-full border border-border">
              UV {weather.health.uvIndex ?? "N/A"}
            </span>
            <span className="inline-flex text-xs px-2 py-1 rounded-full border border-border">
              Pollen {weather.health.pollenIndex ?? "N/A"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            AQ source: {weather.health.airQualitySource}
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {weather.health.healthTips.slice(0, 3).map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 p-4 bg-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <p className="label">Recommended Activities</p>
          </div>
          <ul className="space-y-2">
            {weather.activityRecommendations.slice(0, 3).map((item) => (
              <li key={item.title} className="text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CloudRain className="w-3.5 h-3.5" /> Humidity {weather.current.humidity}%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5" /> Wind {Math.round(weather.current.windSpeedKph)} km/h
        </span>
      </div>
    </div>
  )
}
