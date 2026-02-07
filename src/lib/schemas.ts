import { z } from "zod"

export const DIETARY_OPTIONS = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Lactose-Free",
    "Nut-Free",
] as const

export const ACCESSIBILITY_OPTIONS = [
    "Wheelchair Accessible",
    "Limited Mobility",
    "Visual Impairment",
    "Hearing Impairment",
    "Service Animal",
] as const

export const INTEREST_OPTIONS = [
    "History & Culture",
    "Art & Museums",
    "Nature & Outdoors",
    "Nightlife & Entertainment",
    "Shopping",
    "Food & Culinary",
    "Adventure & Sports",
    "Photography",
    "Architecture",
    "Local Experiences",
] as const

export const itinerarySchema = z.object({
    destination: z.string().min(2, "Destination must be at least 2 characters"),
    numDays: z.number().min(1).max(30, "Trip duration must be between 1 and 30 days"),
    budget: z.enum(["Economy", "Moderate", "Luxury", "No Limit"]),
    ageGroups: z.array(z.enum(["Children", "Teens", "Adults", "Seniors"])).min(1, "Select at least one age group"),
    partySize: z.number().min(1).max(20, "Party size must be between 1 and 20"),
    activityLevel: z.enum(["Relaxed", "Moderate", "Active", "Very Active"]),
    // Preference fields - always arrays, can be empty
    dietaryRestrictions: z.array(z.string()),
    accessibilityNeeds: z.array(z.string()),
    interests: z.array(z.string()),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})

export type ItineraryInput = z.infer<typeof itinerarySchema>

