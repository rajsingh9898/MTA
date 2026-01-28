"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Gradient Mesh */}
            <div className="absolute inset-0 bg-mesh-warm" />

            {/* Subtle Grain Overlay */}
            <div className="absolute inset-0 bg-grain" />

            {/* Floating Decorative Elements */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 2 }}
                className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl"
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="absolute bottom-1/4 right-[10%] w-96 h-96 rounded-full bg-sky-accent/10 blur-3xl"
            />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
                >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        AI-Powered Trip Planning
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="heading-1 mb-6"
                >
                    Plan Your Perfect
                    <br />
                    <span className="text-primary">Adventure</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="body-lg text-muted-foreground max-w-2xl mx-auto mb-10"
                >
                    Create personalized travel itineraries in seconds. Our AI crafts the perfect trip based on your preferences, budget, and travel style.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Button asChild size="xl" className="rounded-full group">
                        <Link href="/create">
                            Create Itinerary
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="xl" className="rounded-full">
                        <Link href="/dashboard">
                            View Dashboard
                        </Link>
                    </Button>
                </motion.div>

                {/* Trust Indicator */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-12 text-sm text-muted-foreground"
                >
                    Trusted by travelers planning trips to <span className="text-foreground font-medium">190+ countries</span>
                </motion.p>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    )
}

export default Hero
