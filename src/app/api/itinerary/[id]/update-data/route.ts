import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { itineraryData, numDays } = body
        const { id } = await params

        if (!itineraryData) {
            return new NextResponse("Missing itinerary data", { status: 400 })
        }

        // Verify ownership
        const itinerary = await prisma.itinerary.findUnique({
            where: {
                id,
            },
            select: {
                userId: true,
            }
        })

        if (!itinerary) {
            return new NextResponse("Not Found", { status: 404 })
        }

        if (itinerary.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const updatedItinerary = await prisma.itinerary.update({
            where: {
                id,
            },
            data: {
                itineraryData,
                ...(numDays !== undefined && { numDays }),
            }
        })

        return NextResponse.json(updatedItinerary)

    } catch (error) {
        console.error("[ITINERARY_UPDATE_DATA]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
