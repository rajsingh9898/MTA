import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markNotificationAsRead } from "@/lib/notifications"

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
    const success = await markNotificationAsRead(id, session.user.id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { message: "Failed to mark notification as read" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { message: "Failed to mark notification as read" },
      { status: 500 }
    )
  }
}
