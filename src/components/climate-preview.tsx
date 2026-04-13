"use client"

import { useEffect, useMemo, useState } from "react"
import { Cloud, Loader2, Sparkles } from "lucide-react"

type ClimateResponse = {
  weather: {
    current: {
      description: string
      temperatureC: number
      feelsLikeC: number
    }
    forecast: Array<{
      date: string
      minTempC: number
      maxTempC: number
      condition: string
    }>
    bestTimeToVisit: {
      summary: string
      months: string[]
    }
    packingSuggestions: string[]
    health: {
      aqi: number | null
      aqiLevel: "GOOD" | "FAIR" | "MODERATE" | "POOR" | "VERY_POOR" | null
      uvIndex: number | null
      pollenIndex: number | null
      airQualitySource: "IQAIR" | "OPENWEATHER" | "NONE"
    }
    activityRecommendations: Array<{
      title: string
      reason: string
    }>
  }
}

export function ClimatePreview({
  destination,
  startDate,
  endDate,
}: {
  destination?: string
  startDate?: string
  endDate?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ClimateResponse["weather"] | null>(null)

  const query = useMemo(() => {
    if (!destination || !startDate || !endDate) return null
    const params = new URLSearchParams({ destination, startDate, endDate, includeAiSummary: "true" })
    return params.toString()
  }, [destination, startDate, endDate])

  useEffect(() => {
    if (!query) {
      return
    }

    let active = true

    fetch(`/api/weather?${query}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Failed to load climate preview")
        }
        return res.json() as Promise<ClimateResponse>
      })
      .then((json) => {
        if (active) setData(json.weather)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load climate preview")
      })

    return () => {
      active = false
    }
  }, [query])

  if (!destination || !startDate || !endDate) {
    return (
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
        <p className="text-sm text-muted-foreground">
          Add destination and trip dates to get live weather, packing tips, and best-time guidance.
        </p>
      </div>
    )
  }

  if (!data && !error) {
    return (
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading climate intelligence...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
        <p className="text-sm text-muted-foreground">{error || "Climate preview is unavailable."}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-primary" />
        <p className="label">Climate Insights</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Now: {Math.round(data.current.temperatureC)}°C, feels like {Math.round(data.current.feelsLikeC)}°C, {data.current.description}.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {data.forecast.slice(0, 3).map((d) => (
          <div key={d.date} className="rounded-xl border border-border/60 p-2 bg-background/60">
            <p className="text-[11px] text-muted-foreground">
              {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
            </p>
            <p className="text-xs font-semibold">{Math.round(d.maxTempC)}°C / {Math.round(d.minTempC)}°C</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{d.condition}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-medium mb-1">Packing</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{data.packingSuggestions.slice(0, 3).join(" • ")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border/60 bg-background/60 p-2">
          <p className="text-[11px] text-muted-foreground">Health</p>
          <p className="text-xs font-semibold">
            AQI {data.health.aqi ?? "N/A"} {data.health.aqiLevel ? `(${data.health.aqiLevel})` : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">UV {data.health.uvIndex ?? "N/A"}</p>
          <p className="text-[11px] text-muted-foreground">Pollen {data.health.pollenIndex ?? "N/A"}</p>
          <p className="text-[11px] text-muted-foreground">Source {data.health.airQualitySource}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/60 p-2">
          <p className="text-[11px] text-muted-foreground">Suggested Activity</p>
          <p className="text-xs font-semibold line-clamp-1">
            {data.activityRecommendations[0]?.title || "Flexible city exploration"}
          </p>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {data.activityRecommendations[0]?.reason || "Adjust based on forecast changes."}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-medium text-primary">Best Time To Visit</p>
        </div>
        <p className="text-xs text-muted-foreground">{data.bestTimeToVisit.summary}</p>
      </div>
    </div>
  )
}
