import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getDestinationImage } from "@/lib/unsplash"
import { SharedItineraryView } from "@/components/shared-itinerary-view"

interface ItineraryData {
    overview: {
        destination: string
        duration: string
        totalEstimatedCost: string
    }
    days: {
        day: number
        activities: {
            timeSlot: string
            name: string
            description: string
            cost: string
            whyRecommended: string
        }[]
        transportation: string
        dailyCost: string
    }[]
    summary: {
        totalEstimatedCost: string
        totalActivities: number
        keyHighlights: string[]
    }
}

export default async function SharedItineraryPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params

    // Find itinerary by share token
    const itinerary = await prisma.itinerary.findUnique({
        where: {
            shareToken: token,
        },
    })

    // Must exist and be public
    if (!itinerary || !itinerary.isPublic) {
        notFound()
    }

    const data = itinerary.itineraryData as unknown as ItineraryData

    // Fetch destination image
    const imageData = await getDestinationImage(itinerary.destination)

    return (
        <SharedItineraryView
            itinerary={itinerary}
            data={data}
            imageUrl={imageData.url}
            photographer={imageData.photographer}
            photographerUrl={imageData.photographerUrl}
        />
    )
}
