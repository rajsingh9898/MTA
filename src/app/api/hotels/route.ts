import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"

const logger = createLogger("hotels-api")

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(value ?? "", 10)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

function parsePrice(value: unknown): number {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = Number(value.replace(/[^0-9.]/g, ""))
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

function extractBudgetFromFeedback(feedback: string): number {
    const match = feedback.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]{2,})/i)
    if (!match?.[1]) return 0
    const parsed = Number(match[1].replace(/,/g, ""))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function getFeedbackTokens(feedback: string): string[] {
    const stopwords = new Set([
        "the", "and", "for", "with", "near", "hotel", "hotels", "in", "at", "my", "is", "to", "a", "an",
        "budget", "price", "cost", "need", "want", "please", "show", "me",
    ])

    return feedback
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !stopwords.has(t) && !/^\d+$/.test(t))
}

function scoreHotelByFeedback(hotel: { name?: string; amenities?: string[]; type?: string }, tokens: string[]): number {
    if (tokens.length === 0) return 0
    const haystack = [hotel.name || "", ...(hotel.amenities || []), hotel.type || ""]
        .join(" ")
        .toLowerCase()

    return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0)
}

function isHotelInBudget(pricePerNight: number, budget: string): boolean {
    if (pricePerNight <= 0) return true
    if (budget === "Economy") return pricePerNight <= 3500
    if (budget === "Moderate") return pricePerNight > 2500 && pricePerNight <= 9000
    if (budget === "Luxury") return pricePerNight > 7000 && pricePerNight <= 25000
    if (budget === "No Limit") return true
    return true
}

function makeFallbackHotels(destination: string, budget: string): Array<{
    name: string
    rate_per_night: { lowest: string; extracted_lowest: number }
    overall_rating: number
    reviews: number
    amenities: string[]
    link: string
    thumbnail: string
}> {
    const budgetBands: Record<string, Array<{ label: string; min: number; max: number }>> = {
        Economy: [
            { label: "Budget Stay", min: 1800, max: 3200 },
            { label: "Value Hotel", min: 2200, max: 3600 },
            { label: "Compact Inn", min: 2000, max: 3400 },
        ],
        Moderate: [
            { label: "Comfort Hotel", min: 4200, max: 7200 },
            { label: "City Stay", min: 4800, max: 7800 },
            { label: "Business Hotel", min: 5200, max: 8600 },
        ],
        Luxury: [
            { label: "Premium Hotel", min: 9800, max: 18000 },
            { label: "Luxury Suites", min: 12500, max: 22000 },
            { label: "Signature Resort", min: 15000, max: 26000 },
        ],
        "No Limit": [
            { label: "Flagship Hotel", min: 12000, max: 28000 },
            { label: "Grand Resort", min: 18000, max: 40000 },
            { label: "Elite Palace", min: 25000, max: 60000 },
        ],
    }

    const bands = budgetBands[budget] || budgetBands.Moderate
    const place = destination.split(",")[0].trim()

    return bands.map((band, index) => {
        const price = Math.round((band.min + band.max) / 2)
        return {
            name: `${place} ${band.label}`,
            rate_per_night: {
                lowest: `₹${price.toLocaleString("en-IN")}`,
                extracted_lowest: price,
            },
            overall_rating: Number((4.1 + index * 0.2).toFixed(1)),
            reviews: 120 + index * 75,
            amenities: ["Wi-Fi", "Breakfast", "Air Conditioning"],
            link: `https://www.google.com/travel/search?q=${encodeURIComponent(`${place} ${band.label}`)}`,
            thumbnail: "",
        }
    })
}

export async function GET(request: Request) {
    const rateLimit = checkRateLimit(getRateLimitKey(request, "hotels"), 30, 60_000)
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        )
    }

    const { searchParams } = new URL(request.url)
    const destination = searchParams.get("destination")
    const budget = searchParams.get("budget") || "Moderate"
    const partySize = parseBoundedInt(searchParams.get("partySize"), 2, 1, 10)
    const specificDate = searchParams.get("date")
    const feedback = (searchParams.get("feedback") || "").trim()
    const maxPrice = parseBoundedInt(searchParams.get("maxPrice"), 0, 0, 1_000_000)

    if (!destination) {
        return NextResponse.json({ error: "Destination is required" }, { status: 400 })
    }

    if (destination.length > 120) {
        return NextResponse.json({ error: "Destination is too long" }, { status: 400 })
    }

    const apiKey = env.SERPAPI_KEY

    const fallbackHotels = makeFallbackHotels(destination, budget)
    const feedbackBudget = extractBudgetFromFeedback(feedback)
    const effectiveMaxPrice = maxPrice > 0 ? maxPrice : feedbackBudget
    const feedbackTokens = getFeedbackTokens(feedback)

    const isWithinPrice = (price: number): boolean => {
        if (price <= 0) return true
        if (effectiveMaxPrice > 0) return price <= effectiveMaxPrice
        return isHotelInBudget(price, budget)
    }

    // Prepare parameters for Google Hotels API via SerpAPI
    try {
        // google_hotels engine requires check_in_date and check_out_date (YYYY-MM-DD)
        const today = new Date();
        const checkIn = specificDate ? new Date(specificDate) : new Date(today);
        if (!specificDate) checkIn.setMonth(checkIn.getMonth() + 1); // Next month default
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1); // 1 night stay

        // Ensure YYYY-MM-DD format strictly
        const formatYMD = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const checkInStr = formatYMD(checkIn);
        const checkOutStr = formatYMD(checkOut);

        let hotelQuery = `${destination} hotels`
        if (budget === "Economy") hotelQuery = `budget cheap hotels in ${destination}`
        else if (budget === "Moderate") hotelQuery = `3 star 4 star hotels in ${destination}`
        else if (budget === "Luxury" || budget === "No Limit") hotelQuery = `5 star luxury hotels in ${destination}`
        if (feedback) hotelQuery = `${hotelQuery} ${feedback}`

        const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(hotelQuery)}&check_in_date=${checkInStr}&check_out_date=${checkOutStr}&currency=INR&adults=${partySize}&api_key=${apiKey}`

        if (!apiKey) {
            return NextResponse.json({ hotels: fallbackHotels, budget, fallback: true })
        }

        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`SerpAPI Error detail [${response.status}]`, errorText)
            throw new Error("Failed to fetch hotel data")
        }

        const data = await response.json()

        // Extract the hotels from the response
        if (data.properties && Array.isArray(data.properties)) {
            const rankedProperties = [...data.properties]
                .sort((a: { name?: string; amenities?: string[]; type?: string }, b: { name?: string; amenities?: string[]; type?: string }) => {
                    return scoreHotelByFeedback(b, feedbackTokens) - scoreHotelByFeedback(a, feedbackTokens)
                })

            const filteredHotels = rankedProperties
                .filter((hotel: { rate_per_night?: { extracted_lowest?: unknown; lowest?: unknown }; price?: unknown }) => {
                    const price =
                        parsePrice(hotel.rate_per_night?.extracted_lowest) ||
                        parsePrice(hotel.rate_per_night?.lowest) ||
                        parsePrice(hotel.price)
                    return isWithinPrice(price)
                })
                .slice(0, 8)

            const fallbackFiltered = fallbackHotels.filter((hotel) => {
                const price = parsePrice(hotel.rate_per_night?.extracted_lowest)
                return isWithinPrice(price)
            })

            const hotels = filteredHotels.length > 0
                ? filteredHotels
                : [...data.properties.slice(0, 8), ...(fallbackFiltered.length > 0 ? fallbackFiltered : fallbackHotels)].slice(0, 8)

            return NextResponse.json({ hotels, budget, fallback: false })
        }

        return NextResponse.json({ hotels: fallbackHotels, budget, fallback: true })
    } catch (error) {
        logger.error("Error fetching hotels from SerpAPI", error)
        return NextResponse.json({ hotels: fallbackHotels, budget, fallback: true })
    }
}
