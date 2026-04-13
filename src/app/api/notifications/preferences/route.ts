import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserNotificationPreferences, updateUserNotificationPreferences } from "@/lib/notifications"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const preferences = await getUserNotificationPreferences(session.user.id)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json(
      { message: "Failed to fetch notification preferences" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const preferences = await req.json()

    const updated = await updateUserNotificationPreferences(session.user.id, preferences)

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json(
      { message: "Failed to update notification preferences" },
      { status: 500 }
    )
  }
}
