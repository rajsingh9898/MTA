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

  const params = useMemo(() => {
    const query = new URLSearchParams({ destination })
    if (startDate) query.set("startDate", new Date(startDate).toISOString())
    if (endDate) query.set("endDate", new Date(endDate).toISOString())
    query.set("includeAiSummary", "true")
    return query
  }, [destination, startDate, endDate])

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
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{Math.round(weather.current.temperatureC)}°C</p>
          <p className="text-xs text-muted-foreground">Feels like {Math.round(weather.current.feelsLikeC)}°C</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {weather.forecast.slice(0, 4).map((day) => (
          <div key={day.date} className="rounded-xl border border-border/60 p-3 bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-1">
              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
            </p>
            <p className="text-sm font-semibold">{Math.round(day.maxTempC)}°C / {Math.round(day.minTempC)}°C</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{day.condition}</p>
            <p className="text-[11px] text-muted-foreground">Rain {Math.round(day.precipitationChance * 100)}%</p>
          </div>
        ))}
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
