"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeroBackground } from "@/components/ui/hero-background"

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Travel-themed background with landmarks */}
            <HeroBackground />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200/50 mb-8 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                        AI-Powered Trip Planning
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="heading-1 mb-6 text-gray-900"
                >
                    Your Perfect Journey
                    <br />
                    Starts Here
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="body-lg text-gray-700 max-w-2xl mx-auto mb-10"
                >
                    Plan unforgettable trips with AI-powered recommendations. 
                    From hidden gems to iconic landmarks, we craft your ideal travel experience.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Button 
                        asChild 
                        size="xl" 
                        className="rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Link href="/create">
                            Create Your Itinerary
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <Button 
                        asChild 
                        variant="outline" 
                        size="xl" 
                        className="rounded-full bg-white/80 backdrop-blur-sm border-amber-200 text-gray-800 hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                        <Link href="/dashboard">
                            View Dashboard
                        </Link>
                    </Button>
                </motion.div>

                {/* Trust Badge */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-sm text-gray-600 mt-8"
                >
                    Trusted by travelers planning trips to <span className="text-gray-900 font-medium">190+ countries</span>
                </motion.p>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-50/50 to-transparent pointer-events-none" />
        </section>
    )
}

export default Hero
