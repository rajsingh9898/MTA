"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
    MapPin,
    CalendarDays,
    Users,
    Wallet,
    Clock,
    IndianRupee,
    Sparkles,
    ChevronRight,
    ArrowLeft
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ShareItineraryButton } from "@/components/share-itinerary-button"
import { DeleteItineraryButton } from "@/components/delete-itinerary-button"

interface Activity {
    timeSlot: string
    name: string
    description: string
    cost: string
    whyRecommended: string
}

interface Day {
    day: number
    activities: Activity[]
    transportation: string
    dailyCost: string
}

interface ItineraryData {
    overview: {
        destination: string
        duration: string
        totalEstimatedCost: string
    }
    days: Day[]
    summary: {
        totalEstimatedCost: string
        totalActivities: number
        keyHighlights: string[]
    }
}

interface Itinerary {
    id: string
    destination: string
    numDays: number
    budget: string
    partySize: number
    activityLevel: string
    dietaryRestrictions: string[]
    accessibilityNeeds: string[]
    interests: string[]
    shareToken: string | null
    isPublic: boolean
}

interface ItineraryViewProps {
    itinerary: Itinerary
    data: ItineraryData
    imageUrl: string
    photographer?: string
    photographerUrl?: string
}

export function ItineraryView({ itinerary, data, imageUrl, photographer, photographerUrl }: ItineraryViewProps) {
    // Handle case where data is not available
    if (!data || !data.overview) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground">Loading itinerary details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px]">
                <Image
                    src={imageUrl}
                    alt={itinerary.destination}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Button asChild variant="secondary" size="sm" className="rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20">
                        <Link href="/dashboard">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Photo Credit */}
                {photographer && (
                    <div className="absolute top-6 right-6 z-10">
                        <a
                            href={photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/60 hover:text-white/80 transition-colors"
                        >
                            Photo by {photographer}
                        </a>
                    </div>
                )}

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center gap-2 text-white/80 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium uppercase tracking-wide">Your Itinerary</span>
                            </div>
                            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight mb-4">
                                {itinerary.destination}
                            </h1>

                            {/* Meta Tags */}
                            <div className="flex flex-wrap gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {itinerary.numDays} days
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
                                    <Users className="w-3.5 h-3.5" />
                                    {itinerary.partySize} travelers
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
                                    <Wallet className="w-3.5 h-3.5" />
                                    {itinerary.budget}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Actions Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-border"
                >
                    <ShareItineraryButton
                        itineraryId={itinerary.id}
                        initialShareUrl={itinerary.shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${itinerary.shareToken}` : null}
                        initialIsPublic={itinerary.isPublic}
                    />
                    <div className="flex-1" />
                    <DeleteItineraryButton id={itinerary.id} />
                </motion.div>

                {/* Overview Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
                >
                    <div className="bg-card border border-border/60 rounded-2xl p-5">
                        <p className="label mb-2">Total Budget</p>
                        <p className="text-xl font-semibold flex items-center gap-1">
                            {data.overview.totalEstimatedCost || data.summary?.totalEstimatedCost}
                        </p>
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl p-5">
                        <p className="label mb-2">Duration</p>
                        <p className="text-lg font-semibold">
                            {data.overview.duration || `${itinerary.numDays} days`}
                        </p>
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl p-5">
                        <p className="label mb-2">Activity Level</p>
                        <p className="text-lg font-semibold">{itinerary.activityLevel}</p>
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl p-5">
                        <p className="label mb-2">Activities</p>
                        <p className="text-2xl font-semibold">
                            {data.summary?.totalActivities || data.days?.reduce((sum, day) => sum + day.activities.length, 0) || 0}
                        </p>
                    </div>
                </motion.div>

                {/* Highlights */}
                {data.summary?.keyHighlights && data.summary.keyHighlights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold">Trip Highlights</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.summary.keyHighlights.map((highlight, idx) => (
                                <span
                                    key={idx}
                                    className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                                >
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Daily Itinerary */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-display font-semibold">Your Day-by-Day Plan</h2>

                    {data.days?.map((day, dayIdx) => (
                        <motion.div
                            key={day.day}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * dayIdx }}
                            className="bg-card border border-border/60 rounded-2xl overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="label text-primary">Day {day.day}</span>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Daily cost: {day.dailyCost}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Activities */}
                            <div className="p-6 space-y-6">
                                {day.activities.map((activity, actIdx) => (
                                    <div key={actIdx} className="flex gap-4">
                                        {/* Time */}
                                        <div className="flex-shrink-0 w-24">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                {activity.timeSlot}
                                            </div>
                                        </div>

                                        {/* Timeline Dot */}
                                        <div className="relative flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                                            {actIdx < day.activities.length - 1 && (
                                                <div className="w-px h-full bg-border absolute top-3" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <h4 className="font-semibold">{activity.name}</h4>
                                                <span className="text-sm font-medium text-primary whitespace-nowrap">
                                                    {activity.cost}
                                                </span>
                                            </div>

                                            {activity.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                            )}

                                            {activity.whyRecommended && (
                                                <div className="mt-2 flex items-start gap-2 text-sm">
                                                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <span className="text-muted-foreground">{activity.whyRecommended}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Transportation Footer */}
                            {day.transportation && (
                                <div className="px-6 py-4 bg-secondary/30 border-t border-border/40">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="text-sm text-muted-foreground">Transportation:</span>
                                        <span className="text-sm">{day.transportation}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
