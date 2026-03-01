"use client"

import { useState, useEffect } from "react"
import { Building2, Star, ExternalLink, Loader2, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Hotel {
    name: string
    rate_per_night?: {
        lowest?: string
        extracted_lowest?: number
    }
    overall_rating?: number
    reviews?: number
    amenities?: string[]
    link?: string
    thumbnail?: string
}

interface DailyHotelSuggestionProps {
    destination: string
    dayNumber: number
    specificDate?: string
    partySize?: number
}

export function DailyHotelSuggestion({ destination, dayNumber, specificDate, partySize }: DailyHotelSuggestionProps) {
    const [hotels, setHotels] = useState<Hotel[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const fetchHotels = async () => {
            try {
                // To avoid getting the exact same hotel every day,
                // we'll pass the day number so we can shuffle or pick a specific hotel
                const res = await fetch(`/api/hotels?destination=${encodeURIComponent(destination)}`)
                if (!res.ok) throw new Error("Failed to fetch hotels")
                const data = await res.json()

                if (isMounted && data.hotels && data.hotels.length > 0) {
                    // Pick a hotel based on the day number to vary suggestions
                    setHotels(data.hotels)
                }
            } catch (error) {
                console.error("Error loading hotel:", error)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        fetchHotels()
        return () => { isMounted = false }
    }, [destination])

    if (isLoading) {
        return (
            <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Finding nearby hotels...</span>
            </div>
        )
    }

    if (!hotels || hotels.length === 0) {
        return null
    }

    // Select a hotel to display based on the day number (so it changes per day)
    const suggestedHotel = hotels[(dayNumber - 1) % hotels.length]

    return (
        <div className="px-6 py-4 bg-primary/5 border-t border-border/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                            Suggested Stay near {destination}
                        </span>
                        <h4 className="font-semibold text-base line-clamp-1">{suggestedHotel.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                            {suggestedHotel.overall_rating && (
                                <span className="flex items-center gap-1 text-amber-500 font-medium">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    {suggestedHotel.overall_rating}
                                    <span className="text-muted-foreground font-normal ml-0.5">
                                        ({suggestedHotel.reviews || 0} reviews)
                                    </span>
                                </span>
                            )}
                            {suggestedHotel.rate_per_night?.lowest && (
                                <span className="flex items-center gap-1 font-medium text-foreground">
                                    {suggestedHotel.rate_per_night.lowest}
                                    <span className="text-xs text-muted-foreground font-normal">/ night</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    asChild
                    size="sm"
                    className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 shadow-sm transition-all text-white shrink-0"
                >
                    <a
                        href={(() => {
                            // Instead of trying to append to the deeply encoded Google Entity link from SerpAPI,
                            // we build a fresh search URL that Google Travel will parse correctly.
                            if (specificDate) {
                                const cIn = new Date(specificDate);
                                const cOut = new Date(cIn);
                                cOut.setDate(cOut.getDate() + 1);

                                const formatDate = (d: Date) => {
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                    const day = String(d.getDate()).padStart(2, '0');
                                    return `${y}-${m}-${day}`;
                                };

                                const q = encodeURIComponent(`${suggestedHotel.name} ${destination}`);
                                const adults = partySize && partySize > 0 ? partySize : 2;

                                return `https://www.google.com/travel/search?q=${q}&checkin=${formatDate(cIn)}&checkout=${formatDate(cOut)}&adults=${adults}`;
                            }

                            // Fallback if no specific date is provided
                            return suggestedHotel.link || `https://www.google.com/travel/search?q=${encodeURIComponent(suggestedHotel.name + " " + destination)}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Book Hotel
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                </Button>
            </div>
        </div>
    )
}
