"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    Sparkles,
    MapPin,
    Wallet,
    Clock,
    Users,
    Compass,
    type LucideIcon
} from "lucide-react"

interface Feature {
    title: string
    description: string
    icon: LucideIcon
}

const features: Feature[] = [
    {
        title: "AI-Powered Planning",
        description: "Our AI analyzes thousands of destinations, reviews, and local insights to craft your perfect itinerary.",
        icon: Sparkles,
    },
    {
        title: "Smart Recommendations",
        description: "Get personalized suggestions for attractions, restaurants, and hidden gems based on your travel style.",
        icon: Compass,
    },
    {
        title: "Budget Management",
        description: "Set your budget tier and receive recommendations that maximize value without compromise.",
        icon: Wallet,
    },
    {
        title: "Route Optimization",
        description: "Intelligent scheduling that minimizes travel time and maximizes your experiences each day.",
        icon: Clock,
    },
    {
        title: "Group Planning",
        description: "Plan for any group size with age-appropriate activities and accessibility considerations.",
        icon: Users,
    },
    {
        title: "Real Destinations",
        description: "Access verified information for 190+ countries with accurate costs and travel tips.",
        icon: MapPin,
    },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
        },
    },
}

export function Features() {
    return (
        <section className="py-24 lg:py-32 relative">
            {/* Background */}
            <div className="absolute inset-0 bg-secondary/30" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <span className="label text-primary mb-4 block">Features</span>
                    <h2 className="heading-2 mb-4">
                        Everything you need to plan the perfect trip
                    </h2>
                    <p className="body-lg text-muted-foreground">
                        Powerful features designed to make travel planning effortless and enjoyable.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="group relative bg-card rounded-2xl p-6 border border-border/60 hover:border-primary/30 hover:shadow-elevated transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <feature.icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

export default Features
