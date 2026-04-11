import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createWishlistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

// GET /api/wishlist - Get all user's wishlists
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

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            itinerary: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: wishlists })
  } catch (error) {
    console.error("Error fetching wishlists:", error)
    return NextResponse.json(
      { error: "Failed to fetch wishlists" },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Create a new wishlist
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
    const validatedData = createWishlistSchema.parse(body)

    // Generate share token if public
    let shareToken = null
    if (validatedData.isPublic) {
      shareToken = crypto.randomUUID()
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
        shareToken,
      },
    })

    return NextResponse.json({ success: true, data: wishlist }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating wishlist:", error)
    return NextResponse.json(
      { error: "Failed to create wishlist" },
      { status: 500 }
    )
  }
}
