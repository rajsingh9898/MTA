import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "./dashboard-client"
import { createLogger } from "@/lib/logger"
import { verifyAdminToken } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-dashboard")

export default async function AdminDashboardPage() {
    // Check admin authentication
    const adminToken = await verifyAdminToken()
    if (!adminToken) {
        redirect("/admin/login")
    }
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
        // Fetch real data from the database securely via Server Components
        const totalUsers = await prisma.user.count()

        const groupedDestinations = await prisma.itinerary.groupBy({
            by: ['destination']
        })
        const totalDestinations = groupedDestinations.length

        const totalTrips = await prisma.itinerary.count()

        const totalAccepted = await prisma.itinerary.count({
            where: { status: "ACCEPTED" }
        })

        const sumDaysResult = await prisma.itinerary.aggregate({
            _sum: {
                numDays: true
            }
        })
        const totalDays = sumDaysResult._sum.numDays || 0

        recentTripsRaw = await prisma.itinerary.findMany({
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
        })

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
