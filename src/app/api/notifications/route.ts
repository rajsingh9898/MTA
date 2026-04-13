import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/notifications"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type") as any
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const result = await getUserNotifications(session.user.id, {
      unreadOnly,
      type,
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
