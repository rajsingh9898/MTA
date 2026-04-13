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
    origin: z.string().optional(),
})

export type ItineraryInput = z.infer<typeof itinerarySchema>

export const weatherRequestSchema = z.object({
    destination: z.string().min(2, "Destination is required"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    includeAiSummary: z.coerce.boolean().optional(),
})

export const weatherResponseSchema = z.object({
    destination: z.string(),
    location: z.object({
        name: z.string(),
        country: z.string().optional(),
        lat: z.number(),
        lon: z.number(),
    }),
    current: z.object({
        observedAt: z.string(),
        condition: z.string(),
        description: z.string(),
        temperatureC: z.number(),
        feelsLikeC: z.number(),
        humidity: z.number(),
        windSpeedKph: z.number(),
    }),
    forecast: z.array(z.object({
        date: z.string(),
        condition: z.string(),
        description: z.string(),
        minTempC: z.number(),
        maxTempC: z.number(),
        humidity: z.number(),
        windSpeedKph: z.number(),
        precipitationChance: z.number(),
        feelsLikeC: z.number(),
    })),
    packingSuggestions: z.array(z.string()),
    health: z.object({
        aqi: z.number().int().min(1).max(5).nullable(),
        aqiLevel: z.enum(["GOOD", "FAIR", "MODERATE", "POOR", "VERY_POOR"]).nullable(),
        uvIndex: z.number().nullable(),
        pollenIndex: z.number().nullable(),
        airQualitySource: z.enum(["IQAIR", "OPENWEATHER", "NONE"]),
        healthTips: z.array(z.string()),
    }),
    activityRecommendations: z.array(z.object({
        title: z.string(),
        type: z.enum(["INDOOR", "OUTDOOR", "FLEX"]),
        reason: z.string(),
    })),
    bestTimeToVisit: z.object({
        months: z.array(z.string()),
        summary: z.string(),
        travelScore: z.enum(["GOOD", "MIXED", "CHALLENGING"]),
    }),
    generatedAt: z.string(),
})

