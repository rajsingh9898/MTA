import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/price-alerts/[id] - Delete a price alert
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

    const alert = await prisma.priceAlert.findUnique({
      where: { id },
    })

    if (!alert) {
      return NextResponse.json({ error: "Price alert not found" }, { status: 404 })
    }

    // Check if user owns the alert
    if (alert.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.priceAlert.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Price alert deleted" })
  } catch (error) {
    console.error("Error deleting price alert:", error)
    return NextResponse.json(
      { error: "Failed to delete price alert" },
      { status: 500 }
    )
  }
}
