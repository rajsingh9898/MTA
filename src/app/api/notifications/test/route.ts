import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { NotificationCreators } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Trigger one of each type of notification for testing
    await NotificationCreators.tripConfirmed(
      userId,
      "Paris, France",
      "test-itinerary-123"
    )

    await NotificationCreators.priceDropAlert(
      userId,
      "Tokyo, Japan",
      150000,
      120000,
      "test-itinerary-456"
    )

    await NotificationCreators.newRecommendation(
      userId,
      "Bali, Indonesia",
      "Because you love tropical beaches and relaxed vibes."
    )

    await NotificationCreators.friendTripCreated(
      userId,
      "Alex",
      "New York City",
      "friend-123"
    )

    await NotificationCreators.tripReminder(
      userId,
      "London, UK",
      3,
      "test-itinerary-789"
    )

    return NextResponse.json({ success: true, message: "Test notifications triggered!" })
  } catch (error) {
    console.error("Error triggering test notifications:", error)
    return NextResponse.json(
      { message: "Failed to trigger test notifications" },
      { status: 500 }
    )
  }
}
