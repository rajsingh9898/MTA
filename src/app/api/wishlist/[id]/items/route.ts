import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addItemSchema = z.object({
  itineraryId: z.string(),
  notes: z.string().optional(),
})

// POST /api/wishlist/[id]/items - Add item to wishlist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
    }

    // Check if user owns the wishlist
    if (wishlist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = addItemSchema.parse(body)

    // Check if itinerary exists
    const itinerary = await prisma.itinerary.findUnique({
      where: { id: validatedData.itineraryId },
    })

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_itineraryId: {
          wishlistId: id,
          itineraryId: validatedData.itineraryId,
        },
      },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: "Item already in wishlist" },
        { status: 400 }
      )
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: id,
        itineraryId: validatedData.itineraryId,
        notes: validatedData.notes,
      },
      include: {
        itinerary: true,
      },
    })

    return NextResponse.json({ success: true, data: wishlistItem }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error adding item to wishlist:", error)
    return NextResponse.json(
      { error: "Failed to add item to wishlist" },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist/[id]/items/[itemId] - Remove item from wishlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
    }

    // Check if user owns the wishlist
    if (wishlist.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 })
    }

    await prisma.wishlistItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true, message: "Item removed from wishlist" })
  } catch (error) {
    console.error("Error removing item from wishlist:", error)
    return NextResponse.json(
      { error: "Failed to remove item from wishlist" },
      { status: 500 }
    )
  }
}
