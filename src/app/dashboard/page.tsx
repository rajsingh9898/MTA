import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Plus, Map, Compass } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Itinerary } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ItineraryCard } from "@/components/itinerary-card"
import { Navbar } from "@/components/ui/navbar"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    const itineraries = await prisma.itinerary.findMany({
        where: {
            userId: session.user.id,
            deletedAt: null,
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    // Get first name for greeting
    const firstName = session.user.email?.split("@")[0] || "Traveler"

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <p className="text-muted-foreground mb-1">Welcome back,</p>
                        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                            {firstName}
                        </h1>
                    </div>
                    <Button asChild size="lg" className="rounded-full">
                        <Link href="/create">
                            <Plus className="w-4 h-4 mr-2" />
                            Plan New Trip
                        </Link>
                    </Button>
                </div>

                {/* Stats Bar */}
                {itineraries.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="label mb-1">Total Trips</p>
                            <p className="text-2xl font-semibold">{itineraries.length}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="label mb-1">Countries</p>
                            <p className="text-2xl font-semibold">
                                {new Set(itineraries.map(i => i.destination.split(",").pop()?.trim())).size}
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="label mb-1">Total Days</p>
                            <p className="text-2xl font-semibold">
                                {itineraries.reduce((sum, i) => sum + i.numDays, 0)}
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="label mb-1">Travelers</p>
                            <p className="text-2xl font-semibold">
                                {itineraries.reduce((sum, i) => sum + i.partySize, 0)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Itineraries */}
                {itineraries.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Compass className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="font-display text-2xl font-semibold mb-3">
                            Your adventures await
                        </h2>
                        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                            You haven&apos;t planned any trips yet. Start your first adventure and let our AI create the perfect itinerary for you.
                        </p>
                        <Button asChild size="lg" className="rounded-full">
                            <Link href="/create">
                                <Map className="w-4 h-4 mr-2" />
                                Create Your First Trip
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-lg font-semibold">Your Trips</h2>
                            <span className="text-sm text-muted-foreground">
                                ({itineraries.length})
                            </span>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {itineraries.map((itinerary: Itinerary) => (
                                <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
