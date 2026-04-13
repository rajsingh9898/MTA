import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUnreadNotificationCount } from "@/lib/notifications"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const count = await getUnreadNotificationCount(session.user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return NextResponse.json(
      { message: "Failed to fetch unread notification count" },
      { status: 500 }
    )
  }
}
