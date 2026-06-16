import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    return NextResponse.json({ isAdmin: !!user?.isAdmin })
  } catch (error) {
    console.error("Error in is-admin check:", error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}