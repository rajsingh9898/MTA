import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/ui/navbar"
import { MapPinned, PlaneTakeoff, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDestinationsPage() {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        redirect("/login")
    }

    const groupedDestinations = await prisma.itinerary.groupBy({
        by: ["destination"],
        _count: { destination: true },
        orderBy: {
            _count: {
                destination: "desc"
            }
        },
        take: 20,
    })

    const totalDestinations = groupedDestinations.length
    const topTrips = groupedDestinations.reduce((sum, item) => sum + item._count.destination, 0)

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Destinations</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                                Back to Overview
                            </Link>
                            <Link href="/admin/trips" className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
                                <PlaneTakeoff className="w-4 h-4" />
                                View Destination Trips
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tracked Destinations</p>
                            <p className="font-display text-3xl font-semibold">{totalDestinations}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Trips In This List</p>
                            <p className="font-display text-3xl font-semibold">{topTrips}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <h2 className="font-semibold text-sm">Most Planned Destinations</h2>
                            <Link href="/admin/trips" className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1">
                                View Trips <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="divide-y divide-border/60">
                            {groupedDestinations.length === 0 ? (
                                <p className="px-6 py-8 text-sm text-muted-foreground">No destination data yet.</p>
                            ) : (
                                groupedDestinations.map((item) => (
                                    <div key={item.destination} className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                <MapPinned className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-sm">{item.destination}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {item._count.destination} trips
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
