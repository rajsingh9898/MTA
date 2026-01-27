"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { motion } from "framer-motion";

export function Hero() {
    return (
        <section className="flex flex-col items-center justify-center text-center py-32 px-4 relative z-10 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm"
            >
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Now with GPT-4o Integration
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-6xl md:text-8xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 max-w-4xl leading-tight"
            >
                Plan Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-600">Perfect Trip</span> with AI
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
            >
                Generate personalized itineraries in seconds. Choose destinations, set dates, and let our AI craft the ultimate travel plan for you.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
                <Link href="/create" passHref>
                    <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        Start Planning Free
                    </Button>
                </Link>
                <Link href="/demo" passHref>
                    <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg backdrop-blur-sm bg-background/50 hover:bg-background/80 transition-all">
                        Watch Demo
                    </Button>
                </Link>
            </motion.div>

            {/* Bottom gradient mask for seamless transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>
    );
}

export default Hero;
