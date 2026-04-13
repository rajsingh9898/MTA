import { prisma } from "@/lib/prisma"

export type NotificationType = "TRIP_STATUS" | "PRICE_DROP" | "RECOMMENDATION" | "SOCIAL" | "REMINDER" | "WEATHER"
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  data?: any
  itineraryId?: string
  relatedUserId?: string
  expiresAt?: Date
}

export interface NotificationPreferences {
  tripStatusUpdates: boolean
  priceDropAlerts: boolean
  recommendations: boolean
  socialNotifications: boolean
  reminders: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

// Get or create user notification preferences
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  let preferences = await prisma.$queryRaw`
    SELECT * FROM notification_preferences 
    WHERE user_id = ${userId}
  ` as any[]

  if (!preferences || preferences.length === 0) {
    preferences = await prisma.$queryRaw`
      INSERT INTO notification_preferences (id, user_id, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, NOW(), NOW())
      RETURNING *
    ` as any[]
  }

  const pref = preferences[0]
  return {
    tripStatusUpdates: pref.trip_status_updates,
    priceDropAlerts: pref.price_drop_alerts,
    recommendations: pref.recommendations,
    socialNotifications: pref.social_notifications,
    reminders: pref.reminders,
    emailNotifications: pref.email_notifications,
    pushNotifications: pref.push_notifications,
    smsNotifications: pref.sms_notifications,
    quietHoursEnabled: pref.quiet_hours_enabled,
    quietHoursStart: pref.quiet_hours_start || undefined,
    quietHoursEnd: pref.quiet_hours_end || undefined
  }
}

// Update user notification preferences
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const updated = await prisma.$queryRaw`
    INSERT INTO notification_preferences (id, user_id, trip_status_updates, price_drop_alerts, recommendations, social_notifications, reminders, email_notifications, push_notifications, sms_notifications, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, created_at, updated_at)
    VALUES (gen_random_uuid(), ${userId}, ${preferences.tripStatusUpdates ?? true}, ${preferences.priceDropAlerts ?? true}, ${preferences.recommendations ?? true}, ${preferences.socialNotifications ?? true}, ${preferences.reminders ?? true}, ${preferences.emailNotifications ?? true}, ${preferences.pushNotifications ?? true}, ${preferences.smsNotifications ?? false}, ${preferences.quietHoursEnabled ?? false}, ${preferences.quietHoursStart ?? null}, ${preferences.quietHoursEnd ?? null}, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      trip_status_updates = COALESCE(${preferences.tripStatusUpdates}, notification_preferences.trip_status_updates),
      price_drop_alerts = COALESCE(${preferences.priceDropAlerts}, notification_preferences.price_drop_alerts),
      recommendations = COALESCE(${preferences.recommendations}, notification_preferences.recommendations),
      social_notifications = COALESCE(${preferences.socialNotifications}, notification_preferences.social_notifications),
      reminders = COALESCE(${preferences.reminders}, notification_preferences.reminders),
      email_notifications = COALESCE(${preferences.emailNotifications}, notification_preferences.email_notifications),
      push_notifications = COALESCE(${preferences.pushNotifications}, notification_preferences.push_notifications),
      sms_notifications = COALESCE(${preferences.smsNotifications}, notification_preferences.sms_notifications),
      quiet_hours_enabled = COALESCE(${preferences.quietHoursEnabled}, notification_preferences.quiet_hours_enabled),
      quiet_hours_start = COALESCE(${preferences.quietHoursStart}, notification_preferences.quiet_hours_start),
      quiet_hours_end = COALESCE(${preferences.quietHoursEnd}, notification_preferences.quiet_hours_end),
      updated_at = NOW()
    RETURNING *
  ` as any[]

  const pref = updated[0]
  return {
    tripStatusUpdates: pref.trip_status_updates,
    priceDropAlerts: pref.price_drop_alerts,
    recommendations: pref.recommendations,
    socialNotifications: pref.social_notifications,
    reminders: pref.reminders,
    emailNotifications: pref.email_notifications,
    pushNotifications: pref.push_notifications,
    smsNotifications: pref.sms_notifications,
    quietHoursEnabled: pref.quiet_hours_enabled,
    quietHoursStart: pref.quiet_hours_start || undefined,
    quietHoursEnd: pref.quiet_hours_end || undefined
  }
}

// Check if notifications should be sent (respects quiet hours)
function shouldSendNotification(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) return true

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = (preferences.quietHoursStart || "22:00").split(':').map(Number)
  const [endHour, endMinute] = (preferences.quietHoursEnd || "08:00").split(':').map(Number)
  
  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime < startTime && currentTime >= endTime
  }

  return currentTime < startTime || currentTime >= endTime
}

// Check if specific notification type is enabled
function isNotificationTypeEnabled(
  preferences: NotificationPreferences,
  type: NotificationType
): boolean {
  switch (type) {
    case "TRIP_STATUS":
      return preferences.tripStatusUpdates
    case "PRICE_DROP":
      return preferences.priceDropAlerts
    case "RECOMMENDATION":
      return preferences.recommendations
    case "SOCIAL":
      return preferences.socialNotifications
    case "REMINDER":
      return preferences.reminders
    case "WEATHER":
      return preferences.reminders
    default:
      return true
  }
}

// Create a notification
export async function createNotification(data: NotificationData): Promise<any> {
  const preferences = await getUserNotificationPreferences(data.userId)

  // Check if notification type is enabled
  if (!isNotificationTypeEnabled(preferences, data.type)) {
    console.log(`Notification type ${data.type} is disabled for user ${data.userId}`)
    return null
  }

  // Check quiet hours
  if (!shouldSendNotification(preferences)) {
    console.log(`Quiet hours active for user ${data.userId}, notification deferred`)
    return null
  }

  try {
    const notification = await prisma.$queryRaw`
      INSERT INTO notifications (id, user_id, type, title, message, data, priority, itinerary_id, related_user_id, expires_at, created_at)
      VALUES (gen_random_uuid(), ${data.userId}, ${data.type}, ${data.title}, ${data.message}, ${JSON.stringify(data.data) || null}::jsonb, ${data.priority || "NORMAL"}, ${data.itineraryId || null}, ${data.relatedUserId || null}, ${data.expiresAt || null}, NOW())
      RETURNING *
    ` as any[]

    console.log(`Created notification for user ${data.userId}: ${data.title}`)
    
    // TODO: Send push notification, email, or SMS based on preferences
    // if (preferences.pushNotifications) await sendPushNotification(notification)
    // if (preferences.emailNotifications) await sendEmailNotification(notification)
    // if (preferences.smsNotifications) await sendSMSNotification(notification)

    return notification[0]
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

// Get user notifications with pagination
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean
    type?: NotificationType
    limit?: number
    offset?: number
  } = {}
): Promise<{ notifications: any[]; total: number }> {
  const { unreadOnly = false, type, limit = 20, offset = 0 } = options

  let whereClause = "WHERE user_id = $1"
  const params: any[] = [userId]
  let paramIndex = 2

  if (unreadOnly) {
    whereClause += ` AND read_at IS NULL`
  }
  if (type) {
    whereClause += ` AND type = $${paramIndex}`
    params.push(type)
    paramIndex++
  }

  const [notifications, totalResult] = await Promise.all([
    (await prisma.$queryRawUnsafe(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...params,
      limit,
      offset
    )) as any[],
    (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
      ...params
    )) as any[]
  ])

  // Normalize snake_case DB columns to camelCase for frontend
  const normalized = (notifications || []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data,
    priority: n.priority,
    readAt: n.read_at,
    createdAt: n.created_at,
    expiresAt: n.expires_at,
    itineraryId: n.itinerary_id,
    relatedUserId: n.related_user_id,
  }))

  return {
    notifications: normalized,
    total: Number(totalResult[0]?.count ?? 0)
  }
}


// Mark notification as read
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE id = ${notificationId} AND user_id = ${userId}
    `
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE user_id = ${userId} AND read_at IS NULL
    `
    return result
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return 0
  }
}

// Delete notification
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`
      DELETE FROM notifications 
      WHERE id = ${notificationId} AND user_id = ${userId}
    `
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    return false
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} 
      AND read_at IS NULL 
      AND (expires_at IS NULL OR expires_at > NOW())
    ` as any[]
    return Number(result[0]?.count ?? 0)
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    return 0
  }
}

// Clean up expired notifications
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM notifications 
      WHERE expires_at < NOW()
    `
    console.log(`Cleaned up ${result} expired notifications`)
    return result
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error)
    return 0
  }
}

// Notification creators for specific types
export const NotificationCreators = {
  // Trip status notifications
  tripConfirmed: (userId: string, destination: string, itineraryId: string) =>
    createNotification({
      userId,
      type: "TRIP_STATUS",
      title: "Trip Confirmed! 🎉",
      message: `Your trip to ${destination} has been confirmed. Get ready for an amazing adventure!`,
      priority: "HIGH",
      itineraryId,
      data: { action: "view_itinerary", destination }
    }),

  tripUpdated: (userId: string, destination: string, changes: string[], itineraryId: string) =>
    createNotification({
      userId,
      type: "TRIP_STATUS",
      title: "Trip Updated",
      message: `Your ${destination} trip has been updated: ${changes.join(", ")}`,
      priority: "NORMAL",
      itineraryId,
      data: { action: "view_itinerary", destination, changes }
    }),

  tripReminder: (userId: string, destination: string, daysUntil: number, itineraryId: string) =>
    createNotification({
      userId,
      type: "REMINDER",
      title: daysUntil === 1 ? "Trip Tomorrow! 🚀" : `Trip in ${daysUntil} Days`,
      message: `Your trip to ${destination} is coming up in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Have you packed your bags?`,
      priority: daysUntil <= 3 ? "HIGH" : "NORMAL",
      itineraryId,
      data: { action: "view_itinerary", destination, daysUntil }
    }),

  weatherAlert: (userId: string, destination: string, summary: string, itineraryId: string) =>
    createNotification({
      userId,
      type: "WEATHER",
      title: "Weather Advisory",
      message: `Upcoming weather for ${destination}: ${summary}`,
      priority: "HIGH",
      itineraryId,
      data: { action: "view_itinerary", destination, summary }
    }),

  packingReminder: (userId: string, destination: string, suggestions: string[], itineraryId: string) =>
    createNotification({
      userId,
      type: "REMINDER",
      title: "Packing Recommendations",
      message: `Suggested items for ${destination}: ${suggestions.slice(0, 3).join(", ")}`,
      priority: "NORMAL",
      itineraryId,
      data: { action: "view_itinerary", destination, suggestions }
    }),

  // Price drop notifications
  priceDropAlert: (userId: string, destination: string, oldPrice: number, newPrice: number, itineraryId: string) =>
    createNotification({
      userId,
      type: "PRICE_DROP",
      title: "Price Drop Alert! 💰",
      message: `Great news! The price for your ${destination} trip dropped from ₹${oldPrice.toLocaleString()} to ₹${newPrice.toLocaleString()}`,
      priority: "HIGH",
      itineraryId,
      data: { action: "view_itinerary", destination, oldPrice, newPrice, savings: oldPrice - newPrice }
    }),

  // Recommendation notifications
  newRecommendation: (userId: string, destination: string, reason: string) =>
    createNotification({
      userId,
      type: "RECOMMENDATION",
      title: "New Trip Recommendation ✈️",
      message: `Based on your preferences, we think you'll love ${destination}. ${reason}`,
      priority: "NORMAL",
      data: { action: "view_recommendation", destination, reason }
    }),

  personalizedRecommendation: (userId: string, destinations: string[], interests: string[]) =>
    createNotification({
      userId,
      type: "RECOMMENDATION",
      title: "Personalized Recommendations For You 🌟",
      message: `We found ${destinations.length} amazing destinations matching your interests in ${interests.join(", ")}`,
      priority: "NORMAL",
      data: { action: "view_recommendations", destinations, interests }
    }),

  // Social notifications
  friendTripCreated: (userId: string, friendName: string, destination: string, friendId: string) =>
    createNotification({
      userId,
      type: "SOCIAL",
      title: `${friendName} is planning a trip! 🗺️`,
      message: `${friendName} just created an itinerary for ${destination}. Check it out for inspiration!`,
      priority: "NORMAL",
      relatedUserId: friendId,
      data: { action: "view_friend_trip", destination, friendName }
    }),

  friendJoined: (userId: string, friendName: string, friendId: string) =>
    createNotification({
      userId,
      type: "SOCIAL",
      title: `${friendName} joined! 👋`,
      message: `${friendName} is now using the travel planner. Connect with them to share trip ideas!`,
      priority: "LOW",
      relatedUserId: friendId,
      data: { action: "view_profile", friendName }
    }),

  tripSharedWithYou: (userId: string, sharerName: string, destination: string, itineraryId: string) =>
    createNotification({
      userId,
      type: "SOCIAL",
      title: `${sharerName} shared a trip with you 🤝`,
      message: `${sharerName} shared their ${destination} itinerary with you. Take a look and maybe join them!`,
      priority: "NORMAL",
      itineraryId,
      data: { action: "view_shared_trip", destination, sharerName }
    })
}
