"use client"


import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
    ArrowLeft,
    Check,
    X,
    RefreshCw,
    Loader2,
    Pencil,
    Trash2
} from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"


import { Button } from "@/components/ui/button"
import { ShareItineraryButton } from "@/components/share-itinerary-button"
import { DeleteItineraryButton } from "@/components/delete-itinerary-button"
import { ExportPdfButton } from "@/components/export-pdf-button"
import { DailyHotelSuggestion } from "@/components/daily-hotel-suggestion"

function getDetailedDate(startDateObj: string | Date | null | undefined, dayIdx: number) {
    if (!startDateObj) return null;
    const date = new Date(startDateObj);
    date.setDate(date.getDate() + dayIdx);
    return date;
}

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
        totalTransportationCost?: string
    }
    tripMetadata?: {
        name?: string
        startDate?: string
        endDate?: string
    }
    hotels?: {
        name: string
        rating: string
        priceRange: string
        description: string
        address?: string
        amenities: string[]
    }[]
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
    name?: string | null
    startDate?: string | Date | null
    endDate?: string | Date | null
    shareToken: string | null
    isPublic: boolean
    status: string
}


interface ItineraryViewProps {
    itinerary: Itinerary
    data: ItineraryData
    imageUrl: string
    photographer?: string
    photographerUrl?: string
    user?: {
        name?: string | null
    }
}

export function ItineraryView({ itinerary, data, imageUrl, photographer, photographerUrl, user }: ItineraryViewProps) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState(false)
    const [showUpdateDialog, setShowUpdateDialog] = useState(false)
    const [feedback, setFeedback] = useState("")
    const [selectedUpdateReason, setSelectedUpdateReason] = useState<string>("")

    const updateReasons = [
        "Slower pace with more free time",
        "More outdoor and nature activities",
        "Cheaper/budget-friendly options",
        "Focus more on historical sites",
        "More family-friendly activities",
        "Other (Write your own)"
    ]

    const [editingDay, setEditingDay] = useState<Day | null>(null)
    const [removingDay, setRemovingDay] = useState<number | null>(null)
    const [isSavingDay, setIsSavingDay] = useState(false)

    async function handleStatusUpdate(status: "ACCEPTED" | "DECLINED") {
        try {
            const response = await fetch(`/api/itinerary/${itinerary.id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            })

            if (!response.ok) throw new Error("Failed to update status")

            if (status === "ACCEPTED") {
                toast.success("Itinerary accepted! It's now on your dashboard.")
                router.push("/dashboard")
                router.refresh()
            } else {
                toast.success("Itinerary declined.")
                router.push("/create") // Or dashboard
                router.refresh()
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        }
    }

    async function handleRegenerate() {
        const finalFeedback = selectedUpdateReason === "Other (Write your own)" || !selectedUpdateReason
            ? feedback
            : `${selectedUpdateReason}. ${feedback}`;

        if (!finalFeedback.trim()) return

        setIsUpdating(true)
        try {
            const response = await fetch(`/api/itinerary/${itinerary.id}/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback: finalFeedback }),
            })

            if (!response.ok) throw new Error("Failed to update itinerary")

            const result = await response.json()
            toast.success("Itinerary updated based on your feedback!")
            setShowUpdateDialog(false)
            setFeedback("")
            setSelectedUpdateReason("")
            router.refresh()
        } catch (error) {
            toast.error("Failed to regenerate itinerary. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    // Helper to calculate total costs based on activities
    function calculateTotalCost(days: Day[], partySize: number) {
        let total = 0
        days.forEach(day => {
            let dayTotal = 0
            day.activities.forEach(activity => {
                // Remove commas and extract numbers from cost string (e.g. "₹5,000", "Free", "$10")
                const costNumber = activity.cost.replace(/,/g, '').match(/\d+/)
                if (costNumber) {
                    let cost = parseInt(costNumber[0], 10)
                    if (activity.cost.toLowerCase().includes("per person")) {
                        cost = cost * partySize
                    }
                    dayTotal += cost
                }
            })

            // Add transportation cost if available
            if (day.transportation) {
                const transMatch = day.transportation.replace(/,/g, '').match(/\d+/)
                if (transMatch) {
                    let tCost = parseInt(transMatch[0], 10)
                    if (day.transportation.toLowerCase().includes("per person")) {
                        tCost = tCost * partySize
                    }
                    dayTotal += tCost
                }
            }

            // Update day's dailyCost
            day.dailyCost = `₹${dayTotal.toLocaleString("en-IN")}`
            total += dayTotal
        })
        return `₹${total.toLocaleString("en-IN")}`
    }

    // Helper to extract and sum transportation costs across all days
    function calculateTotalTransportationCost(days: Day[]) {
        let total = 0
        days.forEach(day => {
            if (!day.transportation) return
            const match = day.transportation.replace(/,/g, '').match(/\d+/)
            if (match) {
                let tCost = parseInt(match[0], 10)
                if (day.transportation.toLowerCase().includes("per person") && itinerary?.partySize) {
                    tCost = tCost * itinerary.partySize
                }
                total += tCost
            }
        })
        return total > 0 ? `₹${total.toLocaleString("en-IN")}` : "N/A"
    }

    async function handleSaveDay() {
        if (!editingDay) return
        setIsSavingDay(true)
        try {
            const updatedDays = data.days.map(d => d.day === editingDay.day ? editingDay : d)

            const newTotalCost = calculateTotalCost(updatedDays, itinerary.partySize)
            const numDays = updatedDays.length
            const totalActivities = updatedDays.reduce((acc, day) => acc + day.activities.length, 0)

            const updatedData = {
                ...data,
                days: updatedDays,
                overview: {
                    ...data.overview,
                    totalEstimatedCost: newTotalCost,
                    duration: `${numDays} days`
                },
                summary: {
                    ...data.summary,
                    totalEstimatedCost: newTotalCost,
                    totalActivities
                }
            }

            const response = await fetch(`/api/itinerary/${itinerary.id}/update-data`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itineraryData: updatedData, numDays }),
            })

            if (!response.ok) throw new Error("Failed to save day")

            toast.success("Day updated successfully!")
            setEditingDay(null)
            router.refresh()
        } catch (error) {
            toast.error("Failed to update day. Please try again.")
        } finally {
            setIsSavingDay(false)
        }
    }

    async function handleRemoveDayConfirm() {
        if (removingDay === null) return
        setIsSavingDay(true)
        try {
            const updatedDays = data.days.filter(d => d.day !== removingDay)
            // Optional: Re-number the days in updatedDays
            updatedDays.forEach((d, idx) => { d.day = idx + 1 })

            const newTotalCost = calculateTotalCost(updatedDays, itinerary.partySize)
            const numDays = updatedDays.length
            const totalActivities = updatedDays.reduce((acc, day) => acc + day.activities.length, 0)

            const updatedData = {
                ...data,
                days: updatedDays,
                overview: {
                    ...data.overview,
                    totalEstimatedCost: newTotalCost,
                    duration: `${numDays} days`
                },
                summary: {
                    ...data.summary,
                    totalEstimatedCost: newTotalCost,
                    totalActivities
                }
            }

            const response = await fetch(`/api/itinerary/${itinerary.id}/update-data`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itineraryData: updatedData, numDays }),
            })

            if (!response.ok) throw new Error("Failed to remove day")

            toast.success("Day removed successfully!")
            setRemovingDay(null)
            router.refresh()
        } catch (error) {
            toast.error("Failed to remove day. Please try again.")
        } finally {
            setIsSavingDay(false)
        }
    }

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
            {/* Premium Background */}
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
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
                                <div className="flex items-center gap-2 text-black mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium uppercase tracking-wide">Your Itinerary</span>
                                </div>
                                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-black tracking-tight mb-4">
                                    {itinerary.destination}
                                </h1>

                                {/* Meta Tags */}
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 backdrop-blur-sm text-black text-sm">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        {itinerary.numDays} days
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 backdrop-blur-sm text-black text-sm">
                                        <Users className="w-3.5 h-3.5" />
                                        {itinerary.partySize} travelers
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 backdrop-blur-sm text-black text-sm">
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
                        {itinerary.status === "DRAFT" ? (
                            <Button asChild variant="outline">
                                <a href="#day-by-day-plan">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    View
                                </a>
                            </Button>
                        ) : (
                            <>
                                <ShareItineraryButton
                                    itineraryId={itinerary.id}
                                    initialShareUrl={itinerary.shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${itinerary.shareToken}` : null}
                                    initialIsPublic={itinerary.isPublic}
                                />
                                <ExportPdfButton data={{
                                    ...data,
                                    summary: {
                                        ...data.summary,
                                        totalTransportationCost: data.days ? calculateTotalTransportationCost(data.days) : "N/A"
                                    },
                                    tripMetadata: {
                                        name: itinerary.name || undefined,
                                        startDate: itinerary.startDate ? new Date(itinerary.startDate).toISOString() : undefined,
                                        endDate: itinerary.endDate ? new Date(itinerary.endDate).toISOString() : undefined,
                                        userName: user?.name || undefined,
                                    }
                                }} />
                            </>
                        )}

                        <div className="flex-1" />

                        {itinerary.status === "DRAFT" && (
                            <div className="flex items-center gap-2 mr-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleStatusUpdate("DECLINED")}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Decline
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => setShowUpdateDialog(true)}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Update
                                </Button>

                                <Button
                                    onClick={() => handleStatusUpdate("ACCEPTED")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Accept
                                </Button>
                            </div>
                        )}

                        <DeleteItineraryButton id={itinerary.id} />
                    </motion.div>

                    {/* Update Dialog */}
                    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Itinerary</DialogTitle>
                                <DialogDescription>
                                    Select a reason below, or describe what you would like to change. Our AI will regenerate the itinerary based on your feedback.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {updateReasons.map((reason) => (
                                        <Button
                                            key={reason}
                                            type="button"
                                            variant={selectedUpdateReason === reason ? "default" : "outline"}
                                            className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                                            onClick={() => {
                                                setSelectedUpdateReason(reason);
                                                if (reason !== "Other (Write your own)") {
                                                    setFeedback("");
                                                }
                                            }}
                                        >
                                            {reason}
                                        </Button>
                                    ))}
                                </div>

                                {(selectedUpdateReason === "Other (Write your own)" || selectedUpdateReason !== "") && (
                                    <Textarea
                                        placeholder={selectedUpdateReason === "Other (Write your own)" ? "e.g. I want more outdoor activities, or swap the museum for a hiking trip." : "Any additional details (optional)"}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowUpdateDialog(false)
                                        setSelectedUpdateReason("")
                                        setFeedback("")
                                    }}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRegenerate}
                                    disabled={(!feedback.trim() && selectedUpdateReason === "Other (Write your own)") || (!feedback.trim() && !selectedUpdateReason) || isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Regenerate
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>


                    {/* Overview Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12"
                    >
                        <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col justify-between">
                            <div>
                                <p className="label mb-2">Total Budget</p>
                                <p className="text-xl font-semibold flex items-center gap-1">
                                    {data.overview.totalEstimatedCost || data.summary?.totalEstimatedCost}
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
                                *Transportation charges not included
                            </p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <p className="label mb-2">Transportation</p>
                            <p className="text-xl font-semibold flex items-center gap-1">
                                {data.days ? calculateTotalTransportationCost(data.days) : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
                                *Approximate sum
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
                    <div className="space-y-8" id="day-by-day-plan">
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
                                            <div className="flex items-center gap-3">
                                                <span className="label text-primary">Day {day.day}</span>
                                                {(() => {
                                                    const dDate = getDetailedDate(itinerary.startDate, dayIdx);
                                                    if (dDate) {
                                                        return (
                                                            <span className="text-sm font-medium text-muted-foreground bg-primary/5 px-2.5 py-1 rounded-md border border-border/40">
                                                                {dDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Daily cost: {day.dailyCost}
                                            </p>
                                        </div>
                                        {itinerary.status === "DRAFT" && (
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingDay({ ...day })}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRemovingDay(day.day)}>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
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
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Transportation:</span>
                                                <span className="text-sm">{day.transportation}</span>
                                            </div>

                                            {/* Render parsed cost if available */}
                                            {(() => {
                                                const match = day.transportation.replace(/,/g, '').match(/\d+/);
                                                if (match) {
                                                    let tCost = parseInt(match[0], 10)
                                                    if (day.transportation.toLowerCase().includes("per person") && itinerary?.partySize) {
                                                        tCost = tCost * itinerary.partySize
                                                    }
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">Estimated Cost:</span>
                                                            <span className="text-sm font-semibold text-primary">
                                                                ₹{tCost.toLocaleString("en-IN")}
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Estimated Cost:</span>
                                                        <span className="text-sm font-medium text-muted-foreground italic">
                                                            Not specified
                                                        </span>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Hotel Suggestion */}
                                <DailyHotelSuggestion
                                    destination={data.overview.destination}
                                    dayNumber={day.day}
                                    specificDate={getDetailedDate(itinerary.startDate, dayIdx)?.toISOString()}
                                    partySize={itinerary.partySize}
                                />
                            </motion.div>
                        ))}


                    </div>
                </div>
            </div>

            {/* Remove Day Dialog */}
            <Dialog open={removingDay !== null} onOpenChange={(open) => !open && setRemovingDay(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Day</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this day from your itinerary? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemovingDay(null)} disabled={isSavingDay}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRemoveDayConfirm} disabled={isSavingDay}>
                            {isSavingDay ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Day Dialog */}
            <Dialog open={editingDay !== null} onOpenChange={(open) => !open && setEditingDay(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Day {editingDay?.day}</DialogTitle>
                        <DialogDescription>
                            Customize your activities for this day.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {editingDay?.activities.map((activity, idx) => (
                            <div key={idx} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm text-primary">Activity {idx + 1}</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-destructive"
                                        onClick={() => {
                                            const newActivities = [...editingDay.activities]
                                            newActivities.splice(idx, 1)
                                            setEditingDay({ ...editingDay, activities: newActivities })
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Time Slot</label>
                                        <Input
                                            value={activity.timeSlot}
                                            onChange={(e) => {
                                                const newActivities = [...editingDay.activities]
                                                newActivities[idx].timeSlot = e.target.value
                                                setEditingDay({ ...editingDay, activities: newActivities })
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Cost</label>
                                        <Input
                                            value={activity.cost}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Name</label>
                                    <Input
                                        value={activity.name}
                                        onChange={(e) => {
                                            const newActivities = [...editingDay.activities]
                                            newActivities[idx].name = e.target.value
                                            setEditingDay({ ...editingDay, activities: newActivities })
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Description</label>
                                    <Textarea
                                        value={activity.description}
                                        onChange={(e) => {
                                            const newActivities = [...editingDay.activities]
                                            newActivities[idx].description = e.target.value
                                            setEditingDay({ ...editingDay, activities: newActivities })
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => {
                                setEditingDay({
                                    ...editingDay!,
                                    activities: [
                                        ...editingDay!.activities,
                                        { timeSlot: "10:00 AM", name: "New Activity", description: "", cost: "Free", whyRecommended: "" }
                                    ]
                                })
                            }}
                        >
                            + Add Activity
                        </Button>
                        <div className="space-y-2 mt-4 pt-4 border-t">
                            <label className="text-sm font-medium">Transportation</label>
                            <Input
                                value={editingDay?.transportation || ""}
                                onChange={(e) => setEditingDay({ ...editingDay!, transportation: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingDay(null)} disabled={isSavingDay}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveDay} disabled={isSavingDay}>
                            {isSavingDay && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
