import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    const { id } = await params

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
        const itinerary = await prisma.itinerary.findUnique({
            where: { id },
        })

        if (!itinerary) {
            return NextResponse.json({ message: "Not found" }, { status: 404 })
        }

        if (itinerary.userId !== session.user.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await prisma.itinerary.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
