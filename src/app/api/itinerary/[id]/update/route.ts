
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateItineraryWithOpenAI } from "@/lib/openai"

type SuggestedHotel = {
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

async function fetchBestHotel(requestUrl: string, destination: string, budget: string, partySize: number, specificDate?: string | null): Promise<SuggestedHotel | null> {
    try {
        const hotelsUrl = new URL("/api/hotels", requestUrl)
        hotelsUrl.searchParams.set("destination", destination)
        hotelsUrl.searchParams.set("budget", budget)
        hotelsUrl.searchParams.set("partySize", String(partySize))
        if (specificDate) hotelsUrl.searchParams.set("date", specificDate)

        const response = await fetch(hotelsUrl.toString())
        if (!response.ok) return null

        const data = await response.json()
        return Array.isArray(data.hotels) && data.hotels.length > 0 ? data.hotels[0] as SuggestedHotel : null
    } catch {
        return null
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const { feedback } = await req.json()

        if (!feedback) {
            return NextResponse.json({ message: "Feedback is required" }, { status: 400 })
        }

        const itinerary = await prisma.itinerary.findUnique({
            where: { id },
        })

        if (!itinerary) {
            return NextResponse.json({ message: "Itinerary not found" }, { status: 404 })
        }

        if (itinerary.userId !== session.user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        const itineraryData = itinerary.itineraryData as Record<string, any> | null
        const destination = itinerary.destination || itineraryData?.overview?.destination || ""
        const budget = itinerary.budget || itineraryData?.budget || "Moderate"
        const partySize = itinerary.partySize || 2
        const startDate = itinerary.startDate ? new Date(itinerary.startDate).toISOString() : null

        const bestHotel = destination
            ? await fetchBestHotel(req.url, destination, budget, partySize, startDate)
            : null

        // Construct prompt for regeneration
        const currentItinerary = JSON.stringify(itineraryData)
        const hotelContext = bestHotel
            ? `
Current best hotel suggestion:
${JSON.stringify(bestHotel, null, 2)}

If the user mentions hotel pricing, stay category, or hotel changes, update the hotel's cost and recommendation to match the new request.
Include a top-level hotels array in the returned JSON with the updated hotel recommendation when possible.
`
            : ""

        const systemPrompt = `You are a travel itinerary expert. Modify the existing itinerary based on the user's feedback.
IMPORTANT RULES:
1. Return the COMPLETE updated itinerary JSON. Do not return partial updates.
2. Maintain the same JSON structure as the input.
3. Keep the destination and duration the same unless explicitly asked to change.
4. Ensure all costs are in Indian Rupees (₹).
5. The "transportation" field for each day MUST include an estimated numerical cost in INR (e.g., "Metro and walking (₹500)").
6. If hotel pricing or hotel preference changes are requested, update the hotel recommendation too.
`

        const userPrompt = `
        Current Itinerary JSON:
        ${currentItinerary}

        ${hotelContext}

        User Feedback:
        "${feedback}"

        Please update the itinerary based on the feedback.
        `

        // Call OpenAI
        const updatedItineraryJson = await generateItineraryWithOpenAI(userPrompt, systemPrompt)

        if (!updatedItineraryJson) {
            throw new Error("Failed to regenerate itinerary")
        }

        const updatedData = JSON.parse(updatedItineraryJson)

        if (bestHotel) {
            updatedData.hotels = [bestHotel]
        }

        // Update database
        await prisma.itinerary.update({
            where: { id },
            data: {
                itineraryData: updatedData,
                regenerationCount: { increment: 1 },
                // status remains DRAFT
            },
        })

        return NextResponse.json({ success: true, itinerary: updatedData })

    } catch (error: any) {
        console.error("Error updating itinerary:", error)
        return NextResponse.json(
            { message: "Failed to update itinerary", error: error.message },
            { status: 500 }
        )
    }
}
