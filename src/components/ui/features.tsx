"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Brain, Users, Map, Sparkles, Clock, Wallet } from "lucide-react";

import { motion } from "framer-motion";

export function Features() {
    const features = [
        {
            title: "AI-Powered Itineraries",
            description: "Generate personalized travel plans instantly with cutting‑edge AI analysis of thousands of data points.",
            icon: Brain,
        },
        {
            title: "Collaborative Planning",
            description: "Share and edit itineraries with friends or family in real time. Plan together, travel together.",
            icon: Users,
        },
        {
            title: "Smart Recommendations",
            description: "Get suggestions for attractions, restaurants, and activities based on your unique interests and budget.",
            icon: Sparkles,
        },
        {
            title: "Interactive Maps",
            description: "Visualize your trip with integrated maps for every day of your journey.",
            icon: Map,
        },
        {
            title: "Real-time Optimization",
            description: "Our AI optimizes routes to save you time and maximize your experience.",
            icon: Clock,
        },
        {
            title: "Budget Management",
            description: "Keep track of expenses and get recommendations that fit your financial plan.",
            icon: Wallet,
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <section className="py-24 bg-background relative z-0">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                        Everything you need for the <span className="text-primary">perfect trip</span>
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Powerful features to help you plan, organize, and enjoy your travels without the stress.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((f, idx) => (
                        <motion.div key={idx} variants={itemVariants}>
                            <Card className="group border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm hover:-translate-y-1 h-full">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <f.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <CardTitle className="text-xl mb-2">{f.title}</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        {f.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default Features;
