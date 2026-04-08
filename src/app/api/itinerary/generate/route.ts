import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { itinerarySchema } from "@/lib/schemas"
import { searchPerplexity, buildPerplexityQuery } from "@/lib/perplexity"
import { generateItineraryWithOpenAI } from "@/lib/openai"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"

// Helper function to extract numeric value from cost string
function extractCostValue(costString: string): number {
  if (!costString || typeof costString !== "string") return 0;

  const lower = costString.toLowerCase();
  if (lower === 'free' || lower === 'variable' || lower.includes('included')) {
    return 0;
  }

  // Remove currency symbols and extract numbers
  // Handle formats like "₹500", "₹5,000", "₹500-1000", "₹500 - ₹1000"
  const cleanedString = costString.replace(/[₹,\s]/g, '');

  // If it's a range (e.g., "500-1000"), take the average
  if (cleanedString.includes('-')) {
    const parts = cleanedString.split('-').map(p => parseFloat(p.replace(/[^\d.]/g, '')));
    const validParts = parts.filter(p => !isNaN(p));
    if (validParts.length > 0) {
      return validParts.reduce((a, b) => a + b, 0) / validParts.length;
    }
    return 0;
  }

  const match = cleanedString.match(/[\d.]+/);
  const parsed = match ? parseFloat(match[0]) : 0;
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to recalculate costs from activities
function recalculateCosts(itineraryData: any): any {
  if (!itineraryData || !itineraryData.days) {
    return itineraryData;
  }

  let grandTotal = 0;
  let totalActivities = 0;

  // Recalculate daily costs from activities
  const updatedDays = itineraryData.days.map((day: any) => {
    let dailyTotal = 0;

    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach((activity: any) => {
        const cost = extractCostValue(activity.cost);
        dailyTotal += isNaN(cost) ? 0 : cost;
        totalActivities++;
      });
    }

    if (day.transportation) {
      const tCost = extractCostValue(day.transportation);
      // Include transportation in the total cost since the itinerary-view recalculates it this way
      // However, itinerary-view calculates transportation dynamically.
      // We do not add it to `dailyTotal` for `dailyCost` display to avoid double counting if UI displays it separately.
      // Wait, UI does recalculate in calculateTotalCost() by adding both activity and transportation!
      // To be consistent, the server's generated `totalEstimatedCost` MUST include both.
      grandTotal += isNaN(tCost) ? 0 : tCost;
    }

    grandTotal += dailyTotal;

    return {
      ...day,
      dailyCost: `₹${Math.round(dailyTotal).toLocaleString('en-IN')}`
    };
  });

  // Ensure grandTotal is never NaN before formatting
  const safeGrandTotal = isNaN(grandTotal) ? 0 : Math.round(grandTotal);

  return {
    ...itineraryData,
    days: updatedDays,
    overview: {
      ...itineraryData.overview,
      totalEstimatedCost: safeGrandTotal === 0 ? "N/A" : `₹${safeGrandTotal.toLocaleString('en-IN')}`
    },
    summary: {
      ...itineraryData.summary,
      totalEstimatedCost: safeGrandTotal === 0 ? "N/A" : `₹${safeGrandTotal.toLocaleString('en-IN')}`,
      totalActivities
    }
  };
}

// Mock generator for fallback
function generateMockItinerary(destination: string, numDays: number, budget: string): any {
  const activities = [
    { name: "City Walking Tour", cost: "Free", type: "Sightseeing" },
    { name: "Local Museum Visit", cost: "₹500", type: "Culture" },
    { name: "Famous Park Stroll", cost: "Free", type: "Nature" },
    { name: "Traditional Lunch", cost: "₹800", type: "Food" },
    { name: "Historic Landmark", cost: "₹400", type: "History" },
    { name: "Sunset Viewpoint", cost: "Free", type: "Sightseeing" },
    { name: "Dinner at Top Rated Spot", cost: "₹1500", type: "Food" },
    { name: "Evening Market", cost: "Variable", type: "Shopping" }
  ];

  const days = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    activities: [
      {
        timeSlot: "09:00 AM - 12:00 PM",
        name: `${destination} ${activities[i % activities.length].name}`,
        description: `Start your day exploring the beautiful sights of ${destination}.`,
        cost: activities[i % activities.length].cost,
        whyRecommended: "A must-visit location for first-time travelers."
      },
      {
        timeSlot: "01:00 PM - 02:30 PM",
        name: `Lunch at Local Favorite`,
        description: "Enjoy authentic local cuisine in a charming atmosphere.",
        cost: "₹600-1000",
        whyRecommended: "Highly rated by locals and tourists alike."
      },
      {
        timeSlot: "03:00 PM - 06:00 PM",
        name: `${destination} ${activities[(i + 2) % activities.length].name}`,
        description: "Immerse yourself in the local culture and history.",
        cost: activities[(i + 2) % activities.length].cost,
        whyRecommended: "Offers a unique perspective on the city."
      }
    ],
    transportation: "Public transit is convenient and affordable (approx ₹200)",
    dailyCost: budget === "Economy" ? "₹2000-3000" : budget === "Luxury" ? "₹10000+" : "₹4000-6000"
  }));

  return {
    overview: {
      destination,
      duration: `${numDays} Days`,
      totalEstimatedCost: budget === "Economy" ? `₹${numDays * 3000}` : budget === "Luxury" ? `₹${numDays * 15000}` : `₹${numDays * 6000}`
    },
    days,
    summary: {
      totalEstimatedCost: budget === "Economy" ? `₹${numDays * 3000}` : budget === "Luxury" ? `₹${numDays * 15000}` : `₹${numDays * 6000}`,
      totalActivities: numDays * 3,
      keyHighlights: ["Historic City Center", "Local Cuisine Tasting", "Scenic Views"]
    }
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Security: Rate limiting — 5 itinerary generations per IP per 10 minutes
    // Prevents abuse of expensive AI API calls (OpenAI + Perplexity)
    const rateLimit = checkRateLimit(getRateLimitKey(req, "itinerary-generate"), 5, 10 * 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "You\'ve generated too many itineraries. Please wait a few minutes before trying again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    const body = await req.json()
    const validation = itinerarySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validation.error.issues },
        { status: 400 }
      )
    }

    // Extracted in two steps to prevent ghost duplicate errors
    const {
      destination,
      numDays,
      budget,
      ageGroups,
      partySize,
      activityLevel,
    } = validation.data

    const {
      dietaryRestrictions,
      accessibilityNeeds,
      interests,
      startDate,
      endDate,
    } = validation.data

    // origin is stored in itineraryData JSON until DB migration is run
    const origin = validation.data.origin || ""

    let itineraryData;

    // Check if API keys are present
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

    if (!hasOpenAI) {
      console.warn("Missing OPENAI_API_KEY, using mock data generation.");
      itineraryData = generateMockItinerary(destination, numDays, budget);
    } else {
      try {
        // 1. Search Perplexity for real-time data (Optional, can fail gracefully)
        let perplexityData = "";
        if (hasPerplexity) {
          console.log("Searching Perplexity for:", destination)
          try {
            const perplexityQuery = buildPerplexityQuery({
              destination,
              ageGroups,
              activityLevel,
              dietaryRestrictions,
              accessibilityNeeds,
              interests,
              budget,
            })
            perplexityData = await searchPerplexity(perplexityQuery)
          } catch (error: any) {
            console.error("Perplexity search failed, proceeding without real-time data:", error.message)
            // Continue without perplexity data
          }
        }

        // 2. Generate Itinerary with OpenAI
        console.log("Generating itinerary with OpenAI...")
        // Build dietary and accessibility context
        const dietaryContext = dietaryRestrictions.length > 0
          ? `Dietary restrictions: ${dietaryRestrictions.join(", ")}. All restaurant recommendations MUST accommodate these dietary needs.`
          : ""
        const accessibilityContext = accessibilityNeeds.length > 0
          ? `Accessibility requirements: ${accessibilityNeeds.join(", ")}. All venues MUST be accessible for these needs.`
          : ""
        const interestsContext = interests.length > 0
          ? `Prioritize activities related to: ${interests.join(", ")}.`
          : ""

        // Budget tier context for destination-aware pricing
        const budgetTierContext = {
          "Economy": "hostels/budget stays, street food, public transport, free attractions",
          "Moderate": "mid-range hotels, local restaurants, mix of transport options",
          "Luxury": "premium hotels, fine dining, private transfers, exclusive experiences",
          "No Limit": "the best of everything available"
        }

        const systemPrompt = `You are a travel itinerary expert. Create a detailed ${numDays}-day itinerary for ${destination}. 
IMPORTANT RULES:
1. All costs must be in Indian Rupees (₹). Convert if necessary.
2. DESTINATION-AWARE PRICING: Adjust all cost estimates based on ${destination}'s local economy. The same budget tier means different absolute amounts in different places (e.g., "Moderate" in Bhimtal might be ₹3,000/day but in Paris could be ₹15,000/day).
3. ${dietaryContext}
4. ${accessibilityContext}
5. ${interestsContext}
6. Include 3-4 top hotel recommendations that STRICTLY fit the chosen budget tier (${budget}). Do not suggest luxury hotels for economy budgets, and vice versa.`

        const userPrompt = `
          Create a ${numDays}-day itinerary for ${destination} based on these preferences:
          - Budget: ${budget} (meaning: ${budgetTierContext[budget as keyof typeof budgetTierContext]})
          - Party Size: ${partySize}
          - Age Groups: ${ageGroups.join(", ")}
          - Activity Level: ${activityLevel}
          ${dietaryRestrictions.length > 0 ? `- Dietary Restrictions: ${dietaryRestrictions.join(", ")}` : ""}
          ${accessibilityNeeds.length > 0 ? `- Accessibility Needs: ${accessibilityNeeds.join(", ")}` : ""}
          ${interests.length > 0 ? `- Interests: ${interests.join(", ")}` : ""}

          Use this real-time data (if available):
          ${perplexityData}

          Return a valid JSON object with this structure:
          {
            "overview": {
              "destination": "string",
              "duration": "string",
              "totalEstimatedCost": "string (in INR, e.g. ₹15,000)"
            },
            "days": [
              {
                "day": number,
                "activities": [
                  {
                    "timeSlot": "string (e.g. 9:00 AM - 11:00 AM)",
                    "name": "string",
                    "description": "string",
                    "cost": "string (in INR)",
                    "whyRecommended": "string",
                    "accessibilityInfo": "string (optional, include if relevant)",
                    "dietaryOptions": "string (optional, for restaurants only)"
                  }
                ],
                "transportation": "string (MUST include an estimated numerical cost in INR, e.g. 'Metro and walking (₹500)')",
                "dailyCost": "string (in INR)"
              }
            ],
            "summary": {
              "totalEstimatedCost": "string (in INR)",
              "totalActivities": number,
              "keyHighlights": ["string"]
            },
            "hotels": [
              {
                "name": "string",
                "rating": "string (e.g. 4.5/5)",
                "priceRange": "string (must specify exact matching ${budget} budget tier cost in INR, e.g. ₹3,000-5,000/night)",
                "description": "string",
                "address": "string (optional)",
                "amenities": ["string"]
              }
            ]
          }
        `

        const itineraryJson = await generateItineraryWithOpenAI(userPrompt, systemPrompt)

        if (!itineraryJson) {
          throw new Error("OpenAI returned empty response")
        }

        console.log("OpenAI successfully returned itinerary JSON.");
        itineraryData = JSON.parse(itineraryJson)
        console.log("Successfully parsed itinerary JSON.");

      } catch (error: any) {
        console.error("AI Generation failed, falling back to mock data:", error.message);
        itineraryData = generateMockItinerary(destination, numDays, budget);
      }
    }

    // 3. Recalculate costs to ensure accuracy
    console.log("Recalculating costs from activities...")
    itineraryData = recalculateCosts(itineraryData)

    // Embed origin in tripMetadata for use by TripCostEstimator (no DB column needed)
    if (origin) {
      itineraryData = {
        ...itineraryData,
        tripMetadata: {
          ...(itineraryData.tripMetadata || {}),
          origin,
        },
      }
    }

    // 4. Save to Database
    console.log("Saving itinerary to database...")
    console.log("User ID:", session.user.id)
    console.log("Data:", { destination, numDays, budget, partySize })

    try {
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: session.user.id,
          destination,
          numDays,
          budget,
          ageGroups,
          partySize,
          activityLevel,
          dietaryRestrictions,
          accessibilityNeeds,
          interests,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          itineraryData,
        },
      })
      console.log("Itinerary created successfully:", itinerary.id)
      return NextResponse.json({ success: true, itineraryId: itinerary.id })
    } catch (dbError: any) {
      console.error("Database Error:", dbError)
      throw new Error(`Database failed: ${dbError.message}`)
    }

  } catch (error: any) {
    console.error("Generation error stack:", error.stack)
    // Security: Do not leak error stack traces to API responses
    return NextResponse.json(
      { message: "Failed to generate itinerary", error: error.message || "Unknown error" },
      { status: 500 }
    )
  }
}
