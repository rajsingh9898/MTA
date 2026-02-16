
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateItineraryWithOpenAI } from "@/lib/openai"

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

        // Construct prompt for regeneration
        const currentItinerary = JSON.stringify(itinerary.itineraryData)

        const systemPrompt = `You are a travel itinerary expert. Modify the existing itinerary based on the user's feedback.
IMPORTANT RULES:
1. Return the COMPLETE updated itinerary JSON. Do not return partial updates.
2. Maintain the same JSON structure as the input.
3. Keep the destination and duration the same unless explicitly asked to change.
4. Ensure all costs are in Indian Rupees (₹).
`

        const userPrompt = `
        Current Itinerary JSON:
        ${currentItinerary}

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
