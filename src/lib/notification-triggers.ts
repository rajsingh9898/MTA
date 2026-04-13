import { prisma } from "@/lib/prisma"
import { NotificationCreators } from "@/lib/notifications"
import { getWeatherInsights, hasSevereWeather, summarizeSevereWeather } from "@/lib/weather"

// Trigger notification when trip status changes
export async function triggerTripStatusChange(
  itineraryId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const itinerary = await prisma.$queryRaw`
      SELECT * FROM itineraries 
      WHERE id = ${itineraryId}
    ` as any[]

    if (!itinerary || itinerary.length === 0) return

    const trip = itinerary[0]

    if (newStatus === "ACCEPTED" && oldStatus !== "ACCEPTED") {
      await NotificationCreators.tripConfirmed(
        trip.user_id,
        trip.destination,
        itineraryId
      )
      
      // TODO: Schedule reminder notifications when scheduler is implemented
      // const startDate = new Date(trip.start_date)
      // if (startDate > new Date()) {
      //   // 3 days before
      //   await scheduleNotification({...})
      //   // 1 day before
      //   await scheduleNotification({...})
      // }
    } else if (newStatus !== oldStatus) {
      await NotificationCreators.tripUpdated(
        trip.user_id,
        trip.destination,
        [`Status changed from ${oldStatus} to ${newStatus}`],
        itineraryId
      )
    }
  } catch (error) {
    console.error("Error triggering trip status change notification:", error)
  }
}

// Trigger notification when trip is updated
export async function triggerTripUpdate(
  itineraryId: string,
  changes: string[]
) {
  try {
    const itinerary = await prisma.$queryRaw`
      SELECT * FROM itineraries 
      WHERE id = ${itineraryId}
    ` as any[]

    if (!itinerary || itinerary.length === 0) return

    const trip = itinerary[0]

    await NotificationCreators.tripUpdated(
      trip.user_id,
      trip.destination,
      changes,
      itineraryId
    )
  } catch (error) {
    console.error("Error triggering trip update notification:", error)
  }
}

// Trigger price drop notification
export async function triggerPriceDrop(
  itineraryId: string,
  oldPrice: number,
  newPrice: number
) {
  try {
    const itinerary = await prisma.$queryRaw`
      SELECT * FROM itineraries 
      WHERE id = ${itineraryId}
    ` as any[]

    if (!itinerary || itinerary.length === 0) return

    const trip = itinerary[0]

    // Check if user has price alerts for this trip
    const priceAlerts = await prisma.$queryRaw`
      SELECT * FROM price_alerts 
      WHERE itinerary_id = ${itineraryId} 
      AND is_active = true 
      AND target_price >= ${newPrice}
    ` as any[]

    for (const alert of priceAlerts) {
      await NotificationCreators.priceDropAlert(
        alert.user_id,
        trip.destination,
        oldPrice,
        newPrice,
        itineraryId
      )
      
      // Mark alert as triggered
      await prisma.$executeRaw`
        UPDATE price_alerts 
        SET triggered_at = NOW(), is_active = false 
        WHERE id = ${alert.id}
      `
    }
  } catch (error) {
    console.error("Error triggering price drop notification:", error)
  }
}

// Trigger recommendation notification based on user preferences
export async function triggerRecommendation(userId: string) {
  try {
    // Get user's recent itineraries to understand preferences
    const itineraries = await prisma.$queryRaw`
      SELECT destination, interests, budget 
      FROM itineraries 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    ` as any[]

    if (!itineraries || itineraries.length === 0) return

    // Extract interests from recent trips
    const allInterests = new Set<string>()
    const destinations = new Set<string>()
    
    for (const trip of itineraries) {
      if (trip.interests) {
        const interests = Array.isArray(trip.interests) ? trip.interests : []
        interests.forEach((interest: string) => allInterests.add(interest))
      }
      if (trip.destination) {
        destinations.add(trip.destination)
      }
    }

    // Generate recommendations based on interests
    const interestArray = Array.from(allInterests).slice(0, 3)
    if (interestArray.length > 0) {
      // Suggest destinations based on similar travelers
      const recommendedDestinations = await getRecommendedDestinations(interestArray)
      
      if (recommendedDestinations.length > 0) {
        await NotificationCreators.personalizedRecommendation(
          userId,
          recommendedDestinations,
          interestArray
        )
      }
    }
  } catch (error) {
    console.error("Error triggering recommendation notification:", error)
  }
}

// Get recommended destinations based on interests
async function getRecommendedDestinations(interests: string[]): Promise<string[]> {
  // This would typically use a recommendation algorithm
  // For now, return some popular destinations
  const popularDestinations = [
    "Paris", "Tokyo", "New York", "London", "Barcelona",
    "Rome", "Sydney", "Dubai", "Singapore", "Bangkok"
  ]
  
  // Return a random selection
  return popularDestinations
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
}

export async function triggerWeatherAlerts(itineraryId: string) {
  try {
    const itinerary = await prisma.$queryRaw`
      SELECT * FROM itineraries
      WHERE id = ${itineraryId}
    ` as any[]

    if (!itinerary || itinerary.length === 0) return

    const trip = itinerary[0]
    if (!trip.destination) return

    const weather = await getWeatherInsights({
      destination: trip.destination,
      startDate: trip.start_date ? new Date(trip.start_date).toISOString() : undefined,
      endDate: trip.end_date ? new Date(trip.end_date).toISOString() : undefined,
      includeAiSummary: false,
    })

    if (hasSevereWeather(weather.forecast)) {
      await NotificationCreators.weatherAlert(
        trip.user_id,
        trip.destination,
        summarizeSevereWeather(weather.forecast),
        trip.id
      )
    }

    await NotificationCreators.packingReminder(
      trip.user_id,
      trip.destination,
      weather.packingSuggestions,
      trip.id
    )
  } catch (error) {
    console.error("Error triggering weather alert notifications:", error)
  }
}

// Trigger social notification when friend creates trip
export async function triggerFriendTripCreated(
  userId: string,
  friendId: string,
  destination: string
) {
  try {
    await NotificationCreators.friendTripCreated(
      userId,
      "A friend", // Would fetch actual name
      destination,
      friendId
    )
  } catch (error) {
    console.error("Error triggering friend trip notification:", error)
  }
}

// Trigger notification when trip is shared with user
export async function triggerTripShared(
  userId: string,
  sharerId: string,
  destination: string,
  itineraryId: string
) {
  try {
    const sharer = await prisma.$queryRaw`
      SELECT name FROM users 
      WHERE id = ${sharerId}
    ` as any[]

    const sharerName = sharer[0]?.name || "Someone"

    await NotificationCreators.tripSharedWithYou(
      userId,
      sharerName,
      destination,
      itineraryId
    )
  } catch (error) {
    console.error("Error triggering trip shared notification:", error)
  }
}

// Cancel all scheduled notifications for a trip
export async function cancelTripNotifications(itineraryId: string) {
  try {
    // In a real implementation, this would query scheduled notifications
    // and cancel them using the notification scheduler
    console.log(`Cancelling notifications for trip ${itineraryId}`)
  } catch (error) {
    console.error("Error cancelling trip notifications:", error)
  }
}

// Batch process trip reminders (should be run by cron job)
export async function processScheduledReminders() {
  try {
    // Get all upcoming trips in the next 7 days
    const upcomingTrips = await prisma.$queryRaw`
      SELECT * FROM itineraries 
      WHERE status = 'ACCEPTED'
      AND start_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      AND start_date > NOW()
    ` as any[]

    for (const trip of upcomingTrips) {
      const startDate = new Date(trip.start_date)
      const now = new Date()
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil === 3 || daysUntil === 1) {
        await NotificationCreators.tripReminder(
          trip.user_id,
          trip.destination,
          daysUntil,
          trip.id
        )
      }

      if (daysUntil <= 5) {
        await triggerWeatherAlerts(trip.id)
      }
    }
  } catch (error) {
    console.error("Error processing scheduled reminders:", error)
  }
}
