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
    const rawParams = Object.fromEntries(searchParams.entries())
    
    // Convert string numbers to numbers with proper typing
    const searchParamsObj: any = {
      ...rawParams,
      minDuration: rawParams.minDuration ? Number(rawParams.minDuration) : undefined,
      maxDuration: rawParams.maxDuration ? Number(rawParams.maxDuration) : undefined,
      page: rawParams.page ? Number(rawParams.page) : undefined,
      limit: rawParams.limit ? Number(rawParams.limit) : undefined,
    }
    
    const validatedParams = searchSchema.parse(searchParamsObj)
    
    // Build search filters
    const where: any = {}
    
    // Text search across destination
    if (validatedParams.query) {
      where.destination = { contains: validatedParams.query, mode: "insensitive" }
    }
    
    // Specific destination filter
    if (validatedParams.destination) {
      where.destination = { contains: validatedParams.destination, mode: "insensitive" }
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
      case "numDays":
        orderBy = { numDays: validatedParams.sortOrder }
        break
      case "destination":
        orderBy = { destination: validatedParams.sortOrder }
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
    const suggestions: string[] = []
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
      suggestions.push(...destinationSuggestions.map(item => item.destination))
    }
    
    // Format response
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      destination: trip.destination,
      numDays: trip.numDays,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      budget: trip.budget,
      activityLevel: trip.activityLevel,
      partySize: trip.partySize,
      createdAt: trip.createdAt,
      user: trip.user,
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
    console.error('Search error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to search trips' },
      { status: 500 }
    )
  }
}
