import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Plus, Map as MapIcon, Compass } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Itinerary } from "@prisma/client"
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
        <div className="min-h-screen relative">
            {/* Travel-themed background */}
            <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-cream-50 to-yellow-50" />
            <div 
                className="fixed inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='400' viewBox='0 0 800 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2378716C' stroke-width='0.5' fill-opacity='0.1'%3E%3Cpath d='M100 200 Q200 150 300 200 T500 200 Q600 150 700 200'/%3E%3Cpath d='M150 180 Q250 130 350 180 T550 180'/%3E%3Cpath d='M200 220 Q300 270 400 220 T600 220'/%3E%3Ccircle cx='200' cy='180' r='3' fill='%2378716C'/%3E%3Ccircle cx='400' cy='200' r='3' fill='%2378716C'/%3E%3Ccircle cx='600' cy='180' r='3' fill='%2378716C'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '800px 400px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                }}
            />
            
            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <p className="text-muted-foreground mb-1">Welcome</p>
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
                                <MapIcon className="w-4 h-4 mr-2" />
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
        </div>
    )
}
