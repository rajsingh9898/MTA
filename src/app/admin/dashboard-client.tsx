"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Users, Map, Building, Ticket, Star, FileText, ArrowUp, Eye, Calendar, AlertCircle, RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { Navbar } from "@/components/ui/navbar"

export type StatData = {
    totalUsers: number;
    totalDestinations: number;
    totalTrips: number;
    totalAccepted: number;
    totalDays: number;
}

export type RecentTrip = {
    id: string;
    destination: string;
    status: string;
    startDate: Date | string | null;
    endDate: Date | string | null;
    user: {
        name: string | null;
        email: string;
    }
}

interface DashboardClientProps {
    stats: StatData;
    recentTrips: RecentTrip[];
    error?: string;
}

export default function DashboardClient({ stats, recentTrips, error }: DashboardClientProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsMounted(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    const handleGenerateReport = () => {
        const escapeCsv = (value: string | number) => {
            const text = String(value ?? "")
            if (/[\",\n]/.test(text)) {
                return `"${text.replace(/"/g, '""')}"`
            }
            return text
        }

        const rows = [
            ["Metric", "Value"],
            ["Total Users", stats.totalUsers],
            ["Total Destinations", stats.totalDestinations],
            ["Total Trips", stats.totalTrips],
            ["Accepted Trips", stats.totalAccepted],
            ["Total Travel Days", stats.totalDays],
            [],
            ["Recent Trips"],
            ["Trip ID", "User", "Email", "Destination", "Status", "Start Date", "End Date"],
            ...recentTrips.map((trip) => [
                trip.id,
                trip.user.name || "App User",
                trip.user.email,
                trip.destination,
                trip.status,
                formatDate(trip.startDate),
                formatDate(trip.endDate),
            ]),
        ]

        const csv = rows
            .map((row) => row.map((cell) => escapeCsv(cell as string | number)).join(","))
            .join("\n")

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
        link.href = url
        link.download = `admin-report-${timestamp}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast.success("Report downloaded successfully")
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 400)
    }

    if (!isMounted) return null

    // Format date helper
    const formatDate = (date: Date | string | null) => {
        if (!date) return "TBD"
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Format status helper
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Accepted</span>
            case "DECLINED":
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">Declined</span>
            default:
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Draft</span>
        }
    }

    // Initial generator for avatars
    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        }
        return email.substring(0, 2).toUpperCase()
    }

    // Array of background colors for avatars
    const avatarColors = [
        'bg-blue-600', 'bg-cyan-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'
    ]

    return (
        <div className="min-h-screen">
            {/* Premium Background */}
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Portal</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                                Overview
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="bg-card border border-border hover:bg-muted text-foreground px-4 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2 text-sm disabled:opacity-60"
                            >
                                <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                                Refresh
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                Generate Report
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm backdrop-blur-sm">
                            <AlertCircle className="shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-sm">Database Connection Error</h3>
                                <p className="text-xs mt-1 opacity-90">{error}</p>
                                <p className="text-xs mt-1 font-medium opacity-90">Displaying mock data for demonstration purposes.</p>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-6 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <p className="label text-muted-foreground uppercase text-xs font-semibold tracking-wider">Total Users</p>
                                <Users size={20} className="text-primary/70" />
                            </div>
                            <p className="font-display text-3xl font-semibold tracking-tight mb-2">{stats.totalUsers.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUp size={12} className="text-green-500" /> <span className="text-green-500 font-medium">12%</span> since last month
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-6 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <p className="label text-muted-foreground uppercase text-xs font-semibold tracking-wider">Destinations</p>
                                <Map size={20} className="text-primary/70" />
                            </div>
                            <p className="font-display text-3xl font-semibold tracking-tight mb-2">{stats.totalDestinations.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUp size={12} className="text-green-500" /> <span className="text-green-500 font-medium">5%</span> since last month
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-6 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <p className="label text-muted-foreground uppercase text-xs font-semibold tracking-wider">Total Trips</p>
                                <Ticket size={20} className="text-primary/70" />
                            </div>
                            <p className="font-display text-3xl font-semibold tracking-tight mb-2">{stats.totalTrips.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowUp size={12} className="text-green-500" /> <span className="text-green-500 font-medium">18%</span> since last month
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-6 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <p className="label text-muted-foreground uppercase text-xs font-semibold tracking-wider">Accepted Trips</p>
                                <Star size={20} className="text-primary/70" />
                            </div>
                            <p className="font-display text-3xl font-semibold tracking-tight mb-2">{stats.totalAccepted.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Trips marked as accepted</p>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Highlights & Quick Links */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {/* Total Planned Days Banner */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute -right-8 -top-8 text-primary/10 shrink-0 pointer-events-none">
                                    <Calendar size={180} strokeWidth={1} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="label text-primary/80 uppercase text-xs font-semibold tracking-[0.15em] mb-2">Total Travel Days Planned</h3>
                                    <div className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-foreground">{stats.totalDays.toLocaleString()} Days</div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                                            <ArrowUp size={10} /> 24.5%
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">Compared to previous year</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links matching Main Panel aesthetic */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm flex flex-col flex-1">
                                <div className="px-6 py-5 border-b border-border/60 bg-muted/20">
                                    <h3 className="font-semibold text-foreground text-sm">Management Modules</h3>
                                </div>
                                <div className="p-3 grid grid-cols-2 gap-3 flex-1 content-start">
                                    <Link href="/admin/users" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-border/80 transition-all text-center text-xs font-medium text-foreground gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users size={18} className="text-primary" />
                                        </div>
                                        Users
                                    </Link>
                                    <Link href="/admin/destinations" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-border/80 transition-all text-center text-xs font-medium text-foreground gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Map size={18} className="text-primary" />
                                        </div>
                                        Destinations
                                    </Link>
                                    <Link href="/admin/hotels" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-border/80 transition-all text-center text-xs font-medium text-foreground gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building size={18} className="text-primary" />
                                        </div>
                                        Hotels
                                    </Link>
                                    <Link href="/admin/blog" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40 hover:bg-muted/50 hover:border-border/80 transition-all text-center text-xs font-medium text-foreground gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileText size={18} className="text-primary" />
                                        </div>
                                        Blog Posts
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Bookings/Trips */}
                        <div className="lg:col-span-7 bg-card border border-border/60 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm shadow-sm h-full">
                            <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
                                <h3 className="font-semibold text-foreground text-sm">Recent Trips Created</h3>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Destination</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {recentTrips.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                                    {error ? "No recent trips available due to database error." : "No recent trips found."}
                                                </td>
                                            </tr>
                                        ) : (
                                            recentTrips.map((trip, idx) => (
                                                <tr key={trip.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-4 sm:px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`hidden sm:flex w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} text-white flex-col items-center justify-center font-bold text-xs shrink-0`}>
                                                                {getInitials(trip.user.name, trip.user.email)}
                                                            </div>
                                                            <div className="max-w-[120px]">
                                                                <div className="font-medium text-foreground text-xs sm:text-sm truncate" title={trip.user.name || trip.user.email}>
                                                                    {trip.user.name || "App User"}
                                                                </div>
                                                                <div className="text-muted-foreground text-[10px] sm:text-xs truncate" title={trip.user.email}>{trip.user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 sm:px-6">
                                                        <div className="font-medium text-foreground text-xs sm:text-sm truncate">{trip.destination}</div>
                                                        <div className="text-muted-foreground text-[10px] sm:text-xs">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</div>
                                                    </td>
                                                    <td className="px-4 py-4 sm:px-6">
                                                        {getStatusBadge(trip.status)}
                                                    </td>
                                                    <td className="px-4 py-4 sm:px-6 text-right">
                                                        <Link
                                                            href={`/admin/trips/${trip.id}`}
                                                            className="p-1.5 sm:p-2 inline-flex text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                                                            title="View itinerary details"
                                                        >
                                                            <Eye size={14} className="sm:hidden" />
                                                            <Eye size={16} className="hidden sm:block" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-border/60 bg-muted/20 text-center">
                                <Link href="/admin/trips" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer w-full">
                                    View All Trips <span>&rarr;</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

