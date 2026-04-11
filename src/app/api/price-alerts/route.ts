import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createAlertSchema = z.object({
  itineraryId: z.string(),
  targetPrice: z.number().positive(),
})

// GET /api/price-alerts - Get user's price alerts
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const alerts = await prisma.priceAlert.findMany({
      where: { userId: user.id },
      include: {
        itinerary: {
          select: {
            id: true,
            destination: true,
            numDays: true,
            budget: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: alerts })
  } catch (error) {
    console.error("Error fetching price alerts:", error)
    return NextResponse.json(
      { error: "Failed to fetch price alerts" },
      { status: 500 }
    )
  }
}

// POST /api/price-alerts - Create a price alert
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = createAlertSchema.parse(body)

    // Check if itinerary exists
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: validatedData.itineraryId },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Check if alert already exists for this itinerary
    const existingAlert = await prisma.priceAlert.findFirst({
      where: {
        userId: user.id,
        itineraryId: validatedData.itineraryId,
        isActive: true,
      },
    })

    if (existingAlert) {
      return NextResponse.json(
        { error: "Price alert already exists for this trip" },
        { status: 400 }
      )
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        itineraryId: validatedData.itineraryId,
        targetPrice: validatedData.targetPrice,
      },
      include: {
        itinerary: {
          select: {
            id: true,
            destination: true,
            numDays: true,
            budget: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: alert }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating price alert:", error)
    return NextResponse.json(
      { error: "Failed to create price alert" },
      { status: 500 }
    )
  }
}
