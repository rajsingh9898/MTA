import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "./dashboard-client"
import { createLogger } from "@/lib/logger"
import { checkAdmin } from "@/lib/auth-admin"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-dashboard")

export default async function AdminDashboardPage() {
    // Check admin authentication directly from DB
    await checkAdmin()
    let stats = {
        totalUsers: 0,
        totalDestinations: 0,
        totalTrips: 0,
        totalAccepted: 0,
        totalDays: 0,
    }
    let recentTripsRaw: Array<{
        id: string
        destination: string
        status: string
        startDate: Date | null
        endDate: Date | null
        user: { name: string | null; email: string }
    }> = []

    try {
        // Run all database queries in parallel for maximum performance
        const [
            totalUsers,
            groupedDestinations,
            totalTrips,
            totalAccepted,
            sumDaysResult,
            recentTripsData,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.itinerary.groupBy({ by: ['destination'] }),
            prisma.itinerary.count(),
            prisma.itinerary.count({ where: { status: "ACCEPTED" } }),
            prisma.itinerary.aggregate({ _sum: { numDays: true } }),
            prisma.itinerary.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    destination: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                        }
                    }
                }
            }),
        ])

        const totalDestinations = groupedDestinations.length
        const totalDays = sumDaysResult._sum.numDays || 0
        recentTripsRaw = recentTripsData

        stats = {
            totalUsers,
            totalDestinations,
            totalTrips,
            totalAccepted,
            totalDays,
        }
    } catch (error) {
        logger.error("Admin Dashboard DB Error", error)
    }

    return <DashboardClient stats={stats} recentTrips={recentTripsRaw} />
}
