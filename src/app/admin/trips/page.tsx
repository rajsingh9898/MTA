import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/ui/navbar"
import { Eye } from "lucide-react"

export const dynamic = "force-dynamic"

function formatDate(date: Date | null) {
    if (!date) return "TBD"
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

export default async function AdminTripsPage() {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        redirect("/login")
    }

    const trips: Array<{
        id: string
        destination: string
        status: string
        startDate: Date | null
        endDate: Date | null
        numDays: number
        createdAt: Date
        user: { name: string | null; email: string }
    }> = await prisma.itinerary.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            destination: true,
            status: true,
            startDate: true,
            endDate: true,
            numDays: true,
            createdAt: true,
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    })

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">All Trips</h1>
                        </div>
                        <Link href="/admin" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                            Back to Overview
                        </Link>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
                            <p className="text-sm font-semibold">Recent itineraries ({trips.length})</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Destination</th>
                                        <th className="px-6 py-3">Dates</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {trips.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-sm text-muted-foreground text-center">
                                                No trips found.
                                            </td>
                                        </tr>
                                    ) : (
                                        trips.map((trip: (typeof trips)[number]) => (
                                            <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-sm">{trip.user.name || "App User"}</p>
                                                    <p className="text-xs text-muted-foreground">{trip.user.email}</p>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-sm">{trip.destination}</td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground">
                                                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({trip.numDays} days)
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold">{trip.status}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/admin/trips/${trip.id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
