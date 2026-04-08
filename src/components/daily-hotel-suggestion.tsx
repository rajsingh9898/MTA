"use client"

import { useState, useEffect } from "react"
import { Building2, Star, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

function parseHotelPrice(hotel: Hotel): number {
    const extracted = hotel.rate_per_night?.extracted_lowest
    if (typeof extracted === "number" && extracted > 0) return extracted

    const lowest = hotel.rate_per_night?.lowest
    if (typeof lowest === "string") {
        const parsed = Number(lowest.replace(/[^0-9.]/g, ""))
        if (Number.isFinite(parsed) && parsed > 0) return parsed
    }

    return 0
}

function getBudgetCeiling(budget: string): number {
    if (budget === "Economy") return 3500
    if (budget === "Moderate") return 9000
    if (budget === "Luxury") return 25000
    return Number.POSITIVE_INFINITY
}

function deriveBudgetTierFromAmount(amount: number): string {
    if (amount <= 3500) return "Economy"
    if (amount <= 9000) return "Moderate"
    if (amount <= 25000) return "Luxury"
    return "No Limit"
}

function extractBudgetAmountFromFeedback(feedback: string): number | null {
    if (!feedback.trim()) return null
    const match = feedback.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]{2,})/i)
    if (!match?.[1]) return null
    const parsed = Number(match[1].replace(/,/g, ""))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function pickBestHotelForBudget(hotels: Hotel[], budget: string, maxPriceOverride?: number | null): Hotel | null {
    if (!hotels.length) return null

    const ceiling = typeof maxPriceOverride === "number" && maxPriceOverride > 0
        ? Math.min(getBudgetCeiling(budget), maxPriceOverride)
        : getBudgetCeiling(budget)
    const budgetFit = hotels
        .filter((hotel) => {
            const price = parseHotelPrice(hotel)
            return price === 0 || price <= ceiling
        })
        .sort((a, b) => parseHotelPrice(a) - parseHotelPrice(b))

    return budgetFit[0] || hotels[0]
}

function hotelFitsBudget(hotel: Hotel, budget: string, maxPriceOverride?: number | null): boolean {
    const price = parseHotelPrice(hotel)
    if (price === 0) return true
    const ceiling = typeof maxPriceOverride === "number" && maxPriceOverride > 0
        ? Math.min(getBudgetCeiling(budget), maxPriceOverride)
        : getBudgetCeiling(budget)
    return price <= ceiling
}

interface DailyHotelSuggestionProps {
    destination: string
    specificDate?: string
    partySize?: number
    budget?: string
    hotel?: Hotel | null
}

const destinationHotelCache = new Map<string, Hotel[]>()
const destinationInFlight = new Map<string, Promise<Hotel[]>>()

async function getHotelsForDestination(
    destination: string,
    budget: string,
    partySize?: number,
    specificDate?: string,
    feedback?: string,
    maxPrice?: number | null
): Promise<Hotel[]> {
    const key = [
        destination.trim().toLowerCase(),
        budget.toLowerCase(),
        String(partySize || 2),
        specificDate || "",
        (feedback || "").trim().toLowerCase(),
        String(maxPrice || ""),
    ]
        .join("|")
    const cached = destinationHotelCache.get(key)
    if (cached) return cached

    const inFlight = destinationInFlight.get(key)
    if (inFlight) return inFlight

    const requestPromise = (async () => {
        const params = new URLSearchParams({
            destination,
            budget,
            partySize: String(partySize || 2),
            ...(specificDate ? { date: specificDate } : {}),
            ...(feedback?.trim() ? { feedback: feedback.trim() } : {}),
            ...(maxPrice && maxPrice > 0 ? { maxPrice: String(maxPrice) } : {}),
        })
        const res = await fetch(`/api/hotels?${params.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch hotels")
        const data = await res.json()
        const hotels = Array.isArray(data.hotels) ? data.hotels : []
        destinationHotelCache.set(key, hotels)
        return hotels
    })()

    destinationInFlight.set(key, requestPromise)
    try {
        return await requestPromise
    } finally {
        destinationInFlight.delete(key)
    }
}

export function DailyHotelSuggestion({ destination, specificDate, partySize, budget = "Moderate", hotel }: DailyHotelSuggestionProps) {
    const [hotels, setHotels] = useState<Hotel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showUpdater, setShowUpdater] = useState(false)
    const [updateFeedback, setUpdateFeedback] = useState("")
    const [selectedBudget, setSelectedBudget] = useState(budget)
    const [isUpdatingHotel, setIsUpdatingHotel] = useState(false)

    async function loadHotels(currentBudget: string, feedback?: string, maxPriceOverride?: number | null) {
        const list = await getHotelsForDestination(destination, currentBudget, partySize, specificDate, feedback, maxPriceOverride)
        if (list.length === 0) {
            setHotels([])
            return
        }

        const isFeedbackDrivenUpdate = Boolean(feedback?.trim()) || Boolean(maxPriceOverride && maxPriceOverride > 0)

        const savedHotelName = hotel?.name.trim().toLowerCase()
        const matchingLiveHotel = savedHotelName
            ? list.find((item) => item.name.trim().toLowerCase() === savedHotelName)
            : null

        const bestHotel = !isFeedbackDrivenUpdate && matchingLiveHotel && hotelFitsBudget(matchingLiveHotel, currentBudget, maxPriceOverride)
            ? matchingLiveHotel
            : pickBestHotelForBudget(list, currentBudget, maxPriceOverride)

        if (bestHotel) {
            setHotels([bestHotel])
            return
        }

        if (!isFeedbackDrivenUpdate && hotel && hotelFitsBudget(hotel, currentBudget, maxPriceOverride)) {
            setHotels([hotel])
            return
        }

        setHotels(list)
    }

    useEffect(() => {
        let isMounted = true

        const fetchHotels = async () => {
            try {
                await loadHotels(budget)
                if (!isMounted) return
                setSelectedBudget(budget)
            } catch (error) {
                if (isMounted && hotel && hotelFitsBudget(hotel, budget)) {
                    setHotels([hotel])
                }
                console.error("Error loading hotel:", error)
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        fetchHotels()
        return () => { isMounted = false }
    }, [destination, budget, partySize, specificDate, hotel])

    async function handleHotelUpdate() {
        setIsUpdatingHotel(true)
        try {
            const typedBudget = extractBudgetAmountFromFeedback(updateFeedback)
            const effectiveBudget = typedBudget ? deriveBudgetTierFromAmount(typedBudget) : selectedBudget
            await loadHotels(effectiveBudget, updateFeedback, typedBudget)
            setSelectedBudget(effectiveBudget)
            setShowUpdater(false)
            setUpdateFeedback("")
        } catch (error) {
            console.error("Error updating hotel suggestion:", error)
        } finally {
            setIsUpdatingHotel(false)
        }
    }

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

    // Always show the best hotel from the API result.
    const suggestedHotel = hotels[0]

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
                            // Prefer the direct hotel link returned by SerpAPI so displayed and opened prices match.
                            if (suggestedHotel.link) {
                                return suggestedHotel.link
                            }

                            // Fallback: build a Google Travel search URL.
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
                            return `https://www.google.com/travel/search?q=${encodeURIComponent(suggestedHotel.name + " " + destination)}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Book Hotel
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpdater((prev) => !prev)}
                    className="rounded-full"
                >
                    {showUpdater ? "Close Update" : "Update Hotel"}
                </Button>
            </div>

            {showUpdater && (
                <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Budget</p>
                            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose budget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Economy">Economy</SelectItem>
                                    <SelectItem value="Moderate">Moderate</SelectItem>
                                    <SelectItem value="Luxury">Luxury</SelectItem>
                                    <SelectItem value="No Limit">No Limit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Feedback</p>
                            <Textarea
                                value={updateFeedback}
                                onChange={(e) => setUpdateFeedback(e.target.value)}
                                placeholder="Example: my hotel budget is ₹3000, near metro, family-friendly"
                                className="min-h-20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowUpdater(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleHotelUpdate}
                            disabled={isUpdatingHotel}
                        >
                            {isUpdatingHotel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Apply Update
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
