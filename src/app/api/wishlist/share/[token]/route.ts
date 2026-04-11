import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/wishlist/share/[token] - View shared wishlist
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const wishlist = await prisma.wishlist.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!wishlist.isPublic) {
      return NextResponse.json({ error: "Wishlist is not public" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: wishlist })
  } catch (error) {
    console.error("Error fetching shared wishlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch shared wishlist" },
      { status: 500 }
    )
  }
}
