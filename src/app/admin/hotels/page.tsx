import Link from "next/link"
import { redirect } from "next/navigation"
import { verifyAdminToken } from "@/lib/admin-auth"
import { Navbar } from "@/components/ui/navbar"
import { Building2, ExternalLink, Search } from "lucide-react"

export const dynamic = "force-dynamic"

const quickHotelChecks = [
    {
        label: "Delhi - Moderate",
        href: "/api/hotels?destination=Delhi&budget=Moderate",
    },
    {
        label: "Goa - Luxury",
        href: "/api/hotels?destination=Goa&budget=Luxury",
    },
    {
        label: "Jaipur - Economy",
        href: "/api/hotels?destination=Jaipur&budget=Economy",
    },
]

export default async function AdminHotelsPage() {
    const adminToken = await verifyAdminToken()
    if (!adminToken) {
        redirect("/admin/login")
    }

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Hotels</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                                Back to Overview
                            </Link>
                            <Link href="/admin/trips" className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
                                Browse Trips
                            </Link>
                        </div>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-base mb-1">Hotel Discovery API Controls</h2>
                                <p className="text-sm text-muted-foreground">
                                    Use these quick actions to validate live hotel data responses from the existing hotels API.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {quickHotelChecks.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-card border border-border/60 rounded-2xl p-5 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-sm">{item.label}</p>
                                    <ExternalLink className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground">Open API response in a new tab</p>
                            </a>
                        ))}
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl p-6">
                        <Link href="/admin/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
                            <Search className="w-4 h-4" />
                            Review trip hotel usage
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
