import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user to be admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    })

    return NextResponse.json({ 
      message: "User is now admin",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin
      }
    })
  } catch (error) {
    console.error("Error setting admin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
