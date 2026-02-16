
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const { status } = await req.json()

        if (!["ACCEPTED", "DECLINED"].includes(status)) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 })
        }

        const itinerary = await prisma.itinerary.findUnique({
            where: { id },
        })

        if (!itinerary) {
            return NextResponse.json({ message: "Itinerary not found" }, { status: 404 })
        }

        if (itinerary.userId !== session.user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
        }

        if (status === "DECLINED") {
            // Soft delete or hard delete based on preference. Here we use soft delete via deletedAt
            // Wait, schema has deletedAt? 
            // Checking schema file:
            // 73:   deletedAt       DateTime? @map("deleted_at")
            // It does!
            await prisma.itinerary.update({
                where: { id },
                data: { deletedAt: new Date(), status: "DECLINED" },
            })
        } else {
            await prisma.itinerary.update({
                where: { id },
                data: { status: "ACCEPTED" },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error updating status:", error)
        return NextResponse.json(
            { message: "Failed to update status", error: error.message },
            { status: 500 }
        )
    }
}
