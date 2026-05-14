import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/ui/navbar"

export const dynamic = "force-dynamic"

export default async function AdminTripDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        redirect("/login")
    }

    const { id } = await params

    const itinerary = await prisma.itinerary.findUnique({
        where: { id },
        select: {
            id: true,
            destination: true,
            status: true,
            budget: true,
            partySize: true,
            numDays: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
            itineraryData: true,
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    })

    if (!itinerary) {
        notFound()
    }

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Trip Details</h1>
                        </div>
                        <Link href="/admin/trips" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                            Back to Trips
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-2">
                            <p className="text-sm text-muted-foreground">Destination</p>
                            <p className="text-xl font-semibold">{itinerary.destination}</p>
                            <p className="text-sm text-muted-foreground">{itinerary.status}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-2">
                            <p className="text-sm text-muted-foreground">Traveler</p>
                            <p className="text-lg font-semibold">{itinerary.user.name || "App User"}</p>
                            <p className="text-sm text-muted-foreground">{itinerary.user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Budget</p>
                            <p className="font-semibold mt-1">{itinerary.budget}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Party</p>
                            <p className="font-semibold mt-1">{itinerary.partySize}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Days</p>
                            <p className="font-semibold mt-1">{itinerary.numDays}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Trip ID</p>
                            <p className="font-semibold mt-1 truncate" title={itinerary.id}>{itinerary.id}</p>
                        </div>
                    </div>

                    {/* Visual Day-by-day text format */}
                    {typeof itinerary.itineraryData === 'object' && itinerary.itineraryData !== null && "days" in (itinerary.itineraryData as any) && Array.isArray((itinerary.itineraryData as any).days) && (
                        <div className="mb-8 space-y-6">
                            <h2 className="text-xl font-semibold">Day by Day Itinerary</h2>
                            <div className="space-y-4">
                                {(itinerary.itineraryData as any).days.map((day: any, idx: number) => (
                                    <div key={idx} className="bg-card border border-border/60 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/60">
                                            <h3 className="font-semibold text-lg text-primary">Day {day.day}</h3>
                                            {day.dailyCost && <span className="text-sm font-medium bg-secondary/50 px-3 py-1 rounded-full">Cost: {day.dailyCost}</span>}
                                        </div>
                                        <div className="space-y-5">
                                            {day.activities?.map((act: any, actIdx: number) => (
                                                <div key={actIdx} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-primary/50">
                                                    <p className="font-semibold">{act.timeSlot ? `${act.timeSlot} — ` : ""}{act.name || "Activity"}</p>
                                                    {act.description && <p className="text-sm text-muted-foreground mt-1">{act.description}</p>}
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        {act.cost && (
                                                            <span className="bg-muted/30 px-2 py-1 rounded-md border border-border/30">
                                                                Cost: {act.cost}
                                                            </span>
                                                        )}
                                                        {act.dietaryOptions && (
                                                            <span className="bg-muted/30 px-2 py-1 rounded-md border border-border/30">
                                                                {act.dietaryOptions}
                                                            </span>
                                                        )}
                                                        {act.accessibilityInfo && (
                                                            <span className="bg-muted/30 px-2 py-1 rounded-md border border-border/30">
                                                                {act.accessibilityInfo}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <p className="text-sm font-semibold">Raw Itinerary JSON</p>
                        </div>
                        <pre className="p-6 text-xs overflow-auto max-h-[520px] leading-relaxed">
{JSON.stringify(itinerary.itineraryData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
