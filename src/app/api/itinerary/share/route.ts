import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { itineraryId, enableSharing } = await req.json()

        if (!itineraryId) {
            return NextResponse.json({ message: "Itinerary ID required" }, { status: 400 })
        }

        // Verify ownership
        const itinerary = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
        })

        if (!itinerary) {
            return NextResponse.json({ message: "Itinerary not found" }, { status: 404 })
        }

        if (itinerary.userId !== session.user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        // Generate or revoke share token
        let shareToken: string | null = null

        if (enableSharing) {
            // Generate a new share token if enabling and none exists
            shareToken = itinerary.shareToken || randomBytes(16).toString("hex")
        }

        const updated = await prisma.itinerary.update({
            where: { id: itineraryId },
            data: {
                shareToken,
                isPublic: enableSharing,
            },
        })

        const shareUrl = shareToken
            ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/share/${shareToken}`
            : null

        return NextResponse.json({
            success: true,
            isPublic: updated.isPublic,
            shareUrl,
        })

    } catch (error: any) {
        console.error("Share error:", error)
        return NextResponse.json(
            { message: "Failed to update sharing settings", error: error.message },
            { status: 500 }
        )
    }
}
