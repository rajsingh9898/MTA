import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markAllNotificationsAsRead } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const count = await markAllNotificationsAsRead(session.user.id)

    return NextResponse.json({ success: true, markedCount: count })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json(
      { message: "Failed to mark all notifications as read" },
      { status: 500 }
    )
  }
}
