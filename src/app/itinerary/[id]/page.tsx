import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"

import { prisma } from "@/lib/prisma"
import { getDestinationImage } from "@/lib/unsplash"
import { ItineraryView } from "@/components/itinerary-view"

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

export default async function ItineraryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    const { id } = await params

    if (!session) {
        redirect("/login")
    }

    const itinerary = await prisma.itinerary.findUnique({
        where: {
            id,
        },
    })

    if (!itinerary) {
        notFound()
    }

    if (itinerary.userId !== session.user.id) {
        redirect("/dashboard")
    }

    const data = itinerary.itineraryData as unknown as ItineraryData

    // Fetch destination image from Unsplash
    const imageData = await getDestinationImage(itinerary.destination)

    return (
        <ItineraryView
            itinerary={itinerary}
            data={data}
            imageUrl={imageData.url}
            photographer={imageData.photographer}
            photographerUrl={imageData.photographerUrl}
            user={session.user}
        />
    )
}

