import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Plus, Map, Sparkles } from "lucide-react"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Itinerary } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ItineraryCard } from "@/components/itinerary-card"

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

    return (
        <div className="min-h-screen bg-background relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-background to-cyan-500/5 dark:from-teal-900/20 dark:via-background dark:to-cyan-900/20 -z-10" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                            My Adventures
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your planned trips and explore new destinations.
                        </p>
                    </div>
                    <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90">
                        <Link href="/create">
                            <Plus className="mr-2 h-5 w-5" />
                            Plan New Trip
                        </Link>
                    </Button>
                </div>

                {itineraries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-card/50 backdrop-blur-sm rounded-3xl shadow-sm border border-dashed border-border">
                        <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse">
                            <Map className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">
                            No itineraries yet
                        </h2>
                        <p className="text-muted-foreground max-w-md mb-8 text-lg">
                            Your passport is waiting! Start planning your dream vacation today with our AI assistant.
                        </p>
                        <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5">
                            <Link href="/create">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Create Your First Itinerary
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {itineraries.map((itinerary: Itinerary) => (
                            <ItineraryCard key={itinerary.id} itinerary={itinerary} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
