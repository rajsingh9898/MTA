import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/admin-auth"
import { Navbar } from "@/components/ui/navbar"
import { FileText, ArrowRight, PenSquare } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
    const adminToken = await verifyAdminToken()
    if (!adminToken) {
        redirect("/admin/login")
    }

    const destinationSamples: Array<{
        id: string
        destination: string
        createdAt: Date
        user: { name: string | null; email: string }
    }> = await prisma.itinerary.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            destination: true,
            createdAt: true,
            user: {
                select: { name: true, email: true },
            },
        },
    })

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Blog Posts</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                                Back to Overview
                            </Link>
                            <Link href="/admin/trips" className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
                                <PenSquare className="w-4 h-4" />
                                Pick Story Source
                            </Link>
                        </div>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-base mb-1">Content Seed Ideas From Recent Trips</h2>
                                <p className="text-sm text-muted-foreground">
                                    This quick module gives usable story prompts from recent itineraries while full blog CMS features are prepared.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <h2 className="font-semibold text-sm">Recent Trip Ideas</h2>
                            <Link href="/admin/trips" className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1">
                                Open Trips <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="divide-y divide-border/60">
                            {destinationSamples.length === 0 ? (
                                <p className="px-6 py-8 text-sm text-muted-foreground">No trip data available yet for content ideas.</p>
                            ) : (
                                destinationSamples.map((trip) => (
                                    <div key={trip.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium text-sm">Top things to do in {trip.destination}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Source: {trip.user.name || trip.user.email}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/admin/trips/${trip.id}`}
                                            className="text-xs font-semibold text-primary hover:text-primary/80 whitespace-nowrap"
                                        >
                                            View Source Trip
                                        </Link>
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
