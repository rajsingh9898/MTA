import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { markNotificationAsRead, deleteNotification } from "@/lib/notifications"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const success = await deleteNotification(id, session.user.id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { message: "Failed to delete notification" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { message: "Failed to delete notification" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
        { message: "Failed to mark as read" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { message: "Failed to update notification" },
      { status: 500 }
    )
  }
}
