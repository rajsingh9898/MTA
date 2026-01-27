"use client"

import { format } from "date-fns"
import { Calendar, DollarSign, Users, Clock, Sparkles, Navigation, Wallet, Activity, ArrowLeft } from "lucide-react"
import { motion, Variants } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Itinerary } from "@prisma/client"

interface ItineraryData {
    overview: {
        destination: string
        duration: string
        totalEstimatedCost: string
    }
    days: {
        day: number
        activities: {
            timeSlot: string
            name: string
            description: string
            cost: string
            whyRecommended: string
        }[]
        transportation: string
        dailyCost: string
    }[]
    summary: {
        totalEstimatedCost: string
        totalActivities: number
        keyHighlights: string[]
    }
}

interface SharedItineraryViewProps {
    itinerary: Itinerary
    data: ItineraryData
    imageUrl?: string
    photographer?: string
    photographerUrl?: string
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
}

export function SharedItineraryView({ itinerary, data, imageUrl, photographer, photographerUrl }: SharedItineraryViewProps) {
    const defaultImage = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
    const heroImage = imageUrl || defaultImage

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative h-[40vh] w-full bg-slate-900 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-60"
                    style={{ backgroundImage: `url('${heroImage}')` }}
                />

                <div className="relative z-20 container mx-auto h-full flex flex-col justify-end pb-12 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="space-y-4"
                        >
                            <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 border-none backdrop-blur-md">
                                <Sparkles className="w-3 h-3 mr-1" /> Shared Itinerary
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                                {itinerary.destination}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-white/90">
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>{itinerary.numDays} Days</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                                    <Users className="h-4 w-4" />
                                    <span>{itinerary.partySize} Travelers</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                                    <DollarSign className="h-4 w-4" />
                                    <span>{itinerary.budget}</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Button asChild variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                                <Link href="/">
                                    <ArrowLeft className="h-4 w-4" />
                                    Create Your Own
                                </Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {photographer && photographerUrl && (
                    <div className="absolute bottom-2 right-4 z-30">
                        <a
                            href={photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white/50 hover:text-white/80 transition-colors"
                        >
                            Photo by {photographer} on Unsplash
                        </a>
                    </div>
                )}
            </motion.div>

            <div className="container mx-auto py-12 px-4 space-y-12 -mt-8 relative z-30">
                {/* Overview Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Wallet className="w-4 h-4" /> Total Estimated Cost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                {data.summary.totalEstimatedCost}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Total Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                {data.summary.totalActivities}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Trip Highlights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {data.summary.keyHighlights.slice(0, 3).map((highlight, i) => (
                                    <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                        {highlight}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Day by Day */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    <motion.div variants={itemVariants} className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Itinerary</h2>
                    </motion.div>

                    <div className="grid gap-8">
                        {data.days.map((day) => (
                            <motion.div key={day.day} variants={itemVariants}>
                                <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-gray-800">
                                    <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-primary/10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-lg">
                                                    {day.day}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">Day {day.day}</h3>
                                                    <p className="text-muted-foreground text-sm">Explore & Discover</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-lg px-4 py-1 border-primary/20 bg-primary/5">
                                                {day.dailyCost}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="relative">
                                            <div className="absolute left-8 top-6 bottom-6 w-px bg-gradient-to-b from-primary/50 to-transparent md:left-12" />

                                            <div className="space-y-8 p-6 md:p-8">
                                                {day.activities.map((activity, index) => (
                                                    <div key={index} className="relative pl-10 md:pl-16 group">
                                                        <div className="absolute left-[27px] md:left-[43px] top-2 h-3 w-3 rounded-full border-2 border-primary bg-white dark:bg-gray-800 z-10 group-hover:scale-125 transition-transform duration-200" />

                                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                                                    <Clock className="h-4 w-4" />
                                                                    {activity.timeSlot}
                                                                </div>
                                                                <Badge variant="secondary" className="w-fit">{activity.cost}</Badge>
                                                            </div>

                                                            <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                                                                {activity.name}
                                                            </h4>
                                                            <p className="text-muted-foreground mb-4 leading-relaxed">
                                                                {activity.description}
                                                            </p>

                                                            <div className="bg-primary/5 rounded-lg p-3 text-sm border border-primary/10">
                                                                <span className="font-semibold text-primary flex items-center gap-2 mb-1">
                                                                    <Sparkles className="w-3 h-3" /> Why we recommend this:
                                                                </span>
                                                                <span className="text-gray-600 dark:text-gray-300">
                                                                    {activity.whyRecommended}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <Navigation className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold mb-1">Getting Around</h5>
                                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                                        {day.transportation}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Call to action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-center py-12"
                >
                    <h3 className="text-2xl font-bold mb-4">Like this itinerary?</h3>
                    <p className="text-muted-foreground mb-6">Create your own personalized trip with our AI-powered planner.</p>
                    <Button asChild size="lg" className="gap-2">
                        <Link href="/">
                            <Sparkles className="h-5 w-5" />
                            Create Your Itinerary
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
