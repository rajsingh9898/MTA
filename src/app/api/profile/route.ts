import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { firstName, lastName, phone, location } = body

        // Combine first and last name if provided
        const name = [firstName, lastName].filter(Boolean).join(" ")

        // Update the user record in the database
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name || undefined,
                phoneNumber: phone,
                city: location,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                city: true,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[PROFILE_UPDATE_ERROR]", error)
        return new NextResponse("Internal server error", { status: 500 })
    }
}
