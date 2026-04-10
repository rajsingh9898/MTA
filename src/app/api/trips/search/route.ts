import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Search query schema
const searchSchema = z.object({
  query: z.string().optional(),
  destination: z.string().optional(),
  budget: z.enum(["budget-friendly", "moderate", "luxury", "no-limit"]).optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["DRAFT", "ACCEPTED", "DECLINED"]).optional(),
  activityLevel: z.enum(["relaxed", "moderate", "active", "very-active"]).optional(),
  sortBy: z.enum(["createdAt", "numDays", "destination"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate search parameters
    const searchParamsObj = Object.fromEntries(searchParams.entries())
    
    // Convert string numbers to numbers
    if (searchParamsObj.minPrice) searchParamsObj.minPrice = Number(searchParamsObj.minPrice)
    if (searchParamsObj.maxPrice) searchParamsObj.maxPrice = Number(searchParamsObj.maxPrice)
    if (searchParamsObj.minDuration) searchParamsObj.minDuration = Number(searchParamsObj.minDuration)
    if (searchParamsObj.maxDuration) searchParamsObj.maxDuration = Number(searchParamsObj.maxDuration)
    if (searchParamsObj.page) searchParamsObj.page = Number(searchParamsObj.page)
    if (searchParamsObj.limit) searchParamsObj.limit = Number(searchParamsObj.limit)
    
    const validatedParams = searchSchema.parse(searchParamsObj)
    
    // Build search filters
    const where: any = {}
    
    // Text search across destination and description
    if (validatedParams.query) {
      where.OR = [
        { destination: { contains: validatedParams.query, mode: "insensitive" } },
        { description: { contains: validatedParams.query, mode: "insensitive" } },
      ]
    }
    
    // Specific destination filter
    if (validatedParams.destination) {
      where.destination = { contains: validatedParams.destination, mode: "insensitive" }
    }
    
    // Price range filter
    if (validatedParams.minPrice || validatedParams.maxPrice) {
      where.price = {}
      if (validatedParams.minPrice) where.price.gte = validatedParams.minPrice
      if (validatedParams.maxPrice) where.price.lte = validatedParams.maxPrice
    }
    
    // Duration range filter
    if (validatedParams.minDuration || validatedParams.maxDuration) {
      where.numDays = {}
      if (validatedParams.minDuration) where.numDays.gte = validatedParams.minDuration
      if (validatedParams.maxDuration) where.numDays.lte = validatedParams.maxDuration
    }
    
    // Date range filter
    if (validatedParams.startDate || validatedParams.endDate) {
      where.startDate = {}
      if (validatedParams.startDate) where.startDate.gte = new Date(validatedParams.startDate)
      if (validatedParams.endDate) where.startDate.lte = new Date(validatedParams.endDate)
    }
    
    // Status filter
    if (validatedParams.status) {
      where.status = validatedParams.status
    }
    
    // Build sort options
    let orderBy: any = {}
    switch (validatedParams.sortBy) {
      case "price":
        orderBy = { price: validatedParams.sortOrder }
        break
      case "duration":
        orderBy = { numDays: validatedParams.sortOrder }
        break
      case "popularity":
        // For popularity, we'll sort by a combination of views and bookings
        orderBy = { createdAt: validatedParams.sortOrder } // Placeholder - implement popularity logic
        break
      default:
        orderBy = { createdAt: validatedParams.sortOrder }
    }
    
    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit
    
    // Execute search query
    const [trips, totalCount] = await Promise.all([
      prisma.itinerary.findMany({
        where,
        orderBy,
        skip,
        take: validatedParams.limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.itinerary.count({ where }),
    ])
    
    // Get search suggestions for autocomplete
    let suggestions = []
    if (validatedParams.query && validatedParams.query.length > 2) {
      const destinationSuggestions = await prisma.itinerary.findMany({
        where: {
          destination: { contains: validatedParams.query, mode: "insensitive" },
        },
        select: {
          destination: true,
        },
        distinct: ["destination"],
        take: 5,
      })
      suggestions = destinationSuggestions.map(item => item.destination)
    }
    
    // Format response
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      destination: trip.destination,
      description: trip.description,
      price: trip.price,
      numDays: trip.numDays,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      createdAt: trip.createdAt,
      user: trip.user,
      // Add computed fields
      pricePerDay: trip.numDays > 0 ? Math.round(trip.price / trip.numDays) : 0,
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(trip.price),
      formattedDate: trip.startDate ? new Date(trip.startDate).toLocaleDateString() : null,
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        trips: formattedTrips,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validatedParams.limit),
          hasNext: validatedParams.page < Math.ceil(totalCount / validatedParams.limit),
          hasPrev: validatedParams.page > 1,
        },
        filters: {
          query: validatedParams.query,
          destination: validatedParams.destination,
          minPrice: validatedParams.minPrice,
          maxPrice: validatedParams.maxPrice,
          minDuration: validatedParams.minDuration,
          maxDuration: validatedParams.maxDuration,
          startDate: validatedParams.startDate,
          endDate: validatedParams.endDate,
          status: validatedParams.status,
          sortBy: validatedParams.sortBy,
          sortOrder: validatedParams.sortOrder,
        },
        suggestions,
      },
    })
    
  } catch (error) {
    console.error("Search error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search parameters",
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
