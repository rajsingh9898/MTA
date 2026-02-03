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
    Sparkles,
    Share2,
    ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ExportPdfButton } from "@/components/export-pdf-button"

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
}

interface SharedItineraryViewProps {
    itinerary: Itinerary
    data: ItineraryData
    imageUrl: string
    photographer?: string
    photographerUrl?: string
}

export function SharedItineraryView({ itinerary, data, imageUrl, photographer, photographerUrl }: SharedItineraryViewProps) {
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
            {/* Shared Banner */}
            <div className="bg-primary/10 border-b border-primary/20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Share2 className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">Shared Itinerary</span>
                        <span className="text-muted-foreground hidden sm:inline">— Created with MTA</span>
                    </div>
                    <Button asChild size="sm" variant="soft" className="rounded-full">
                        <Link href="/create">
                            Create Your Own
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative h-[45vh] min-h-[350px]">
                <Image
                    src={imageUrl}
                    alt={itinerary.destination}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                {/* Photo Credit */}
                {photographer && (
                    <div className="absolute top-6 right-6 z-10">
                        {photographerUrl ? (
                            <a
                                href={photographerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white/60 hover:text-white/80 transition-colors"
                            >
                                Photo by {photographer}
                            </a>
                        ) : (
                            <span className="text-xs text-white/60">
                                Photo by {photographer}
                            </span>
                        )}
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
                                <span className="text-sm font-medium uppercase tracking-wide">Travel Itinerary</span>
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
                    <ExportPdfButton data={data} />
                    <div className="flex-1" />
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link href="/create">
                            Create Your Own Trip
                        </Link>
                    </Button>
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
                        <p className="text-xl font-semibold">
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
                    <h2 className="text-2xl font-display font-semibold">Day-by-Day Plan</h2>

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

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-16 text-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-10"
                >
                    <h2 className="font-display text-2xl font-semibold mb-3">
                        Inspired by this trip?
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create your own personalized itinerary with AI-powered recommendations tailored just for you.
                    </p>
                </motion.div>
            </div>
            </div>
        </div>
    )
}
