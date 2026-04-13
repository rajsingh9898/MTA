"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { CalendarDays, MapPin, Users, Wallet, ArrowRight, CloudSun } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { WishlistButton } from "@/components/wishlist-button"

interface ItineraryCardProps {
    itinerary: {
        id: string
        destination: string
        numDays: number
        budget: string
        partySize: number
        createdAt: Date
    }
    imageUrl?: string
}

function getDestinationGradient(destination: string): string {
    const gradients = [
        "from-emerald-500 to-teal-600",
        "from-blue-500 to-indigo-600",
        "from-orange-400 to-rose-500",
        "from-violet-500 to-purple-600",
        "from-cyan-500 to-blue-600",
        "from-amber-400 to-orange-500",
        "from-teal-400 to-cyan-600",
        "from-rose-400 to-pink-600",
    ]

    let hash = 0
    for (let i = 0; i < destination.length; i++) {
        hash = destination.charCodeAt(i) + ((hash << 5) - hash)
    }

    return gradients[Math.abs(hash) % gradients.length]
}

function getDestinationInitial(destination: string): string {
    return destination.charAt(0).toUpperCase()
}

export function ItineraryCard({ itinerary, imageUrl }: ItineraryCardProps) {
    const gradient = getDestinationGradient(itinerary.destination)
    const initial = getDestinationInitial(itinerary.destination)
    const [weatherLabel, setWeatherLabel] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        fetch(`/api/weather?destination=${encodeURIComponent(itinerary.destination)}&includeAiSummary=false`)
            .then(async (res) => {
                if (!res.ok) {
                    return null
                }
                return res.json() as Promise<{
                    weather: {
                        current: { condition: string; temperatureC: number }
                    }
                }>
            })
            .then((data) => {
                if (!active || !data?.weather?.current) return
                const c = data.weather.current
                setWeatherLabel(`${Math.round(c.temperatureC)}°C • ${c.condition}`)
            })
            .catch(() => {
                if (active) {
                    setWeatherLabel(null)
                }
            })

        return () => {
            active = false
        }
    }, [itinerary.destination])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Link href={`/itinerary/${itinerary.id}`} className="group block">
                <article className="bg-card border border-border/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-elevated hover:border-primary/20 hover:-translate-y-1">
                    <div className={`relative h-48 overflow-hidden ${!imageUrl ? `bg-gradient-to-br ${gradient}` : "bg-gray-100"}`}>
                        {imageUrl ? (
                            <>
                                <Image
                                    src={imageUrl}
                                    alt={itinerary.destination}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 opacity-10">
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <pattern id={`pattern-${itinerary.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <circle cx="10" cy="10" r="1.5" fill="white" />
                                        </pattern>
                                        <rect x="0" y="0" width="100" height="100" fill={`url(#pattern-${itinerary.id})`} />
                                    </svg>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <span className="text-6xl font-display font-bold text-white/20">{initial}</span>
                                </div>
                            </>
                        )}

                        {weatherLabel ? (
                            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 bg-white/85 text-[11px] font-medium text-slate-700">
                                <CloudSun className="w-3 h-3" />
                                {weatherLabel}
                            </div>
                        ) : null}

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between gap-2 text-white">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <h3 className="font-display text-lg font-semibold tracking-tight line-clamp-1 text-shadow-sm">
                                        {itinerary.destination}
                                    </h3>
                                </div>
                                <div onClick={(e) => e.preventDefault()}>
                                    <WishlistButton itineraryId={itinerary.id} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <p className="label mb-0.5">Duration</p>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                                    <span>{itinerary.numDays} days</span>
                                </div>
                            </div>
                            <div>
                                <p className="label mb-0.5">Travelers</p>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Users className="w-3.5 h-3.5 text-primary" />
                                    <span>{itinerary.partySize}</span>
                                </div>
                            </div>
                            <div>
                                <p className="label mb-0.5">Budget</p>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Wallet className="w-3.5 h-3.5 text-primary" />
                                    <span className="truncate">{itinerary.budget}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/60">
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(itinerary.createdAt), "MMM d, yyyy")}
                            </p>
                            <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                View
                                <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    )
}
