"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import type { Itinerary } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ItineraryCard } from "@/components/itinerary-card"

interface DashboardTripsClientProps {
    upcomingTrips: Itinerary[]
    completedTrips: Itinerary[]
    draftTrips: Itinerary[]
    imageMap: Record<string, string>
}

type TabType = "upcoming" | "completed" | "draft"

export function DashboardTripsClient({
    upcomingTrips,
    completedTrips,
    draftTrips,
    imageMap,
}: DashboardTripsClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>("upcoming")

    const tabs = [
        { id: "upcoming", label: "Upcoming Trips", count: upcomingTrips.length },
        { id: "completed", label: "Completed Trips", count: completedTrips.length },
        { id: "draft", label: "Draft Itineraries", count: draftTrips.length },
    ] as const

    const getActiveTrips = () => {
        switch (activeTab) {
            case "upcoming":
                return upcomingTrips
            case "completed":
                return completedTrips
            case "draft":
                return draftTrips
        }
    }

    const activeTrips = getActiveTrips()

    const getEmptyState = () => {
        switch (activeTab) {
            case "upcoming":
                return (
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-card/30 text-center py-16">
                        <p className="text-sm text-muted-foreground mb-4">No upcoming trips planned yet.</p>
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href="/create">Plan a New Trip</Link>
                        </Button>
                    </div>
                )
            case "completed":
                return (
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-card/30 text-center py-16">
                        <p className="text-sm text-muted-foreground">No completed trips yet. Once your trips end, they will appear here.</p>
                    </div>
                )
            case "draft":
                return (
                    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border bg-card/30 text-center py-16">
                        <p className="text-sm text-muted-foreground mb-4">No draft itineraries found.</p>
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href="/create">Create a Draft</Link>
                        </Button>
                    </div>
                )
        }
    }

    return (
        <div className="space-y-8">
            {/* Tabs Header */}
            <div className="border-b border-border/40 pb-px">
                <div className="flex space-x-8 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative pb-4 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none whitespace-nowrap text-left ${
                                    isActive ? "text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {tab.label}
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabLine"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Grid Container with Animation */}
            <div className="min-h-[250px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTrips.length === 0 ? (
                            getEmptyState()
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeTrips.map((itinerary: Itinerary) => (
                                    <ItineraryCard
                                        key={itinerary.id}
                                        itinerary={itinerary}
                                        imageUrl={imageMap[itinerary.id]}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
