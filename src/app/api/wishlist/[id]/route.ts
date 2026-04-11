import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateWishlistSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/wishlist/[id] - Get a specific wishlist
export async function GET(
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
    })

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })
    }

    // Check if user owns the wishlist or if it's public
    if (wishlist.userId !== user.id && !wishlist.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: wishlist })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    )
  }
}

// PUT /api/wishlist/[id] - Update a wishlist
export async function PUT(
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
    const validatedData = updateWishlistSchema.parse(body)

    // Generate share token if making public
    let shareToken = wishlist.shareToken
    if (validatedData.isPublic && !wishlist.shareToken) {
      shareToken = crypto.randomUUID()
    }

    const updatedWishlist = await prisma.wishlist.update({
      where: { id },
      data: {
        ...validatedData,
        shareToken,
      },
    })

    return NextResponse.json({ success: true, data: updatedWishlist })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error updating wishlist:", error)
    return NextResponse.json(
      { error: "Failed to update wishlist" },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist/[id] - Delete a wishlist
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

    await prisma.wishlist.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Wishlist deleted" })
  } catch (error) {
    console.error("Error deleting wishlist:", error)
    return NextResponse.json(
      { error: "Failed to delete wishlist" },
      { status: 500 }
    )
  }
}
