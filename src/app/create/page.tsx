"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
    MapPin,
    Calendar,
    Wallet,
    Users,
    Activity,
    Heart,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Minus,
    Plus,
    Mountain,
    Loader2
} from "lucide-react"

import { itinerarySchema, ItineraryInput, DIETARY_OPTIONS, ACCESSIBILITY_OPTIONS, INTEREST_OPTIONS } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const STEPS = [
    { id: 1, title: "Destination", description: "Where would you like to go?", icon: MapPin },
    { id: 2, title: "Duration", description: "How long is your trip?", icon: Calendar },
    { id: 3, title: "Budget", description: "What's your budget preference?", icon: Wallet },
    { id: 4, title: "Travelers", description: "Who's coming along?", icon: Users },
    { id: 5, title: "Pace", description: "How active do you want to be?", icon: Activity },
    { id: 6, title: "Preferences", description: "Any special requirements?", icon: Heart },
]

const TRAVELER_TYPES = [
    { id: "Adults", label: "Adults", description: "18-64 years" },
    { id: "Children", label: "Children", description: "0-12 years" },
    { id: "Teens", label: "Teens", description: "13-17 years" },
    { id: "Seniors", label: "Seniors", description: "65+ years" },
] as const

const BUDGET_OPTIONS = [
    { value: "Budget-Friendly", label: "Budget", description: "Hostels, street food, public transport" },
    { value: "Moderate", label: "Moderate", description: "Mid-range hotels, local restaurants" },
    { value: "Luxury", label: "Luxury", description: "Premium hotels, fine dining" },
    { value: "No Limit", label: "No Limit", description: "The best of everything" },
]

const PACE_OPTIONS = [
    { value: "Relaxed", label: "Relaxed", description: "Take it slow, plenty of rest" },
    { value: "Moderate", label: "Moderate", description: "Balanced mix of activities" },
    { value: "Active", label: "Active", description: "Packed schedule, lots to see" },
    { value: "Very Active", label: "Very Active", description: "Non-stop exploration" },
]

const LOADING_MESSAGES = [
    "Finding the best experiences...",
    "Discovering hidden gems...",
    "Planning your routes...",
    "Checking local favorites...",
    "Crafting your perfect itinerary...",
]

export default function CreateItineraryPage() {
    const router = useRouter()
    const { status } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
    const [step, setStep] = useState(1)
    const [travelerCounts, setTravelerCounts] = useState<Record<string, number>>({
        Adults: 1,
        Children: 0,
        Teens: 0,
        Seniors: 0,
    })

    const form = useForm<ItineraryInput>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: {
            destination: "",
            numDays: 5,
            budget: "Moderate",
            ageGroups: ["Adults"],
            partySize: 1,
            activityLevel: "Moderate",
            dietaryRestrictions: [],
            accessibilityNeeds: [],
            interests: [],
        },
    })

    // Cycle loading messages
    useEffect(() => {
        if (!isLoading) return
        let idx = 0
        const interval = setInterval(() => {
            idx = (idx + 1) % LOADING_MESSAGES.length
            setLoadingMessage(LOADING_MESSAGES[idx])
        }, 3000)
        return () => clearInterval(interval)
    }, [isLoading])

    // Update form when traveler counts change
    useEffect(() => {
        const activeGroups = Object.entries(travelerCounts)
            .filter(([_, count]) => count > 0)
            .map(([type]) => type as "Adults" | "Children" | "Teens" | "Seniors")
        const totalPeople = Object.values(travelerCounts).reduce((a, b) => a + b, 0)
        form.setValue("ageGroups", activeGroups.length > 0 ? activeGroups : ["Adults"])
        form.setValue("partySize", totalPeople > 0 ? totalPeople : 1)
    }, [travelerCounts, form])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (status === "unauthenticated") {
        router.push("/login")
        return null
    }

    const nextStep = async () => {
        const fieldsToValidate: (keyof ItineraryInput)[] = []
        switch (step) {
            case 1: fieldsToValidate.push("destination"); break
            case 2: fieldsToValidate.push("numDays"); break
            case 3: fieldsToValidate.push("budget"); break
            case 4: fieldsToValidate.push("ageGroups", "partySize"); break
            case 5: fieldsToValidate.push("activityLevel"); break
        }
        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) setStep((prev) => Math.min(prev + 1, STEPS.length))
    }

    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

    async function onSubmit(data: ItineraryInput) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!response.ok) {
                const text = await response.text()
                try {
                    const error = JSON.parse(text)
                    throw new Error(error.error || error.message || "Failed to generate itinerary")
                } catch {
                    throw new Error(`API returned ${response.status}`)
                }
            }
            const result = await response.json()
            toast.success("Your itinerary is ready!")
            router.push(`/itinerary/${result.itineraryId}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
            setIsLoading(false)
        }
    }

    const updateTravelerCount = (type: string, delta: number) => {
        setTravelerCounts((prev) => {
            const current = prev[type] || 0
            const newValue = Math.max(0, current + delta)
            const otherTotal = Object.entries(prev)
                .filter(([k]) => k !== type)
                .reduce((sum, [_, val]) => sum + val, 0)
            if (newValue === 0 && otherTotal === 0) return prev
            return { ...prev, [type]: newValue }
        })
    }

    const CurrentIcon = STEPS[step - 1].icon

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background */}
            <div className="absolute inset-0 bg-mesh-warm opacity-50" />

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8"
                        >
                            <Mountain className="w-10 h-10 text-primary" />
                        </motion.div>
                        <motion.p
                            key={loadingMessage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-lg text-muted-foreground"
                        >
                            {loadingMessage}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Mountain className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-display text-lg font-semibold">MTA</span>
                    </Link>
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Cancel
                    </Link>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s) => (
                        <div
                            key={s.id}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                s.id === step ? "w-8 bg-primary" : s.id < step ? "bg-primary" : "bg-border"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 pb-8">
                <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-soft">
                    {/* Step Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <CurrentIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
                            {STEPS[step - 1].title}
                        </h1>
                        <p className="text-muted-foreground">
                            {STEPS[step - 1].description}
                        </p>
                    </div>

                    {/* Form Content */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="min-h-[280px] flex flex-col justify-center"
                                >
                                    {/* Step 1: Destination */}
                                    {step === 1 && (
                                        <FormField
                                            control={form.control}
                                            name="destination"
                                            render={({ field }) => (
                                                <FormItem className="space-y-4">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Tokyo, Japan"
                                                            className="h-14 text-lg text-center rounded-2xl"
                                                            autoFocus
                                                            {...field}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault()
                                                                    nextStep()
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-center" />
                                                    <div className="flex flex-wrap justify-center gap-2 pt-4">
                                                        {["Paris, France", "Bali, Indonesia", "New York, USA", "Rome, Italy"].map((dest) => (
                                                            <button
                                                                key={dest}
                                                                type="button"
                                                                onClick={() => {
                                                                    field.onChange(dest)
                                                                    nextStep()
                                                                }}
                                                                className="px-4 py-2 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                                                            >
                                                                {dest}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Step 2: Duration */}
                                    {step === 2 && (
                                        <FormField
                                            control={form.control}
                                            name="numDays"
                                            render={({ field }) => (
                                                <FormItem className="space-y-8">
                                                    <div className="text-center">
                                                        <span className="font-display text-6xl font-semibold text-primary">
                                                            {field.value}
                                                        </span>
                                                        <span className="text-2xl text-muted-foreground ml-2">
                                                            {field.value === 1 ? "day" : "days"}
                                                        </span>
                                                    </div>
                                                    <FormControl>
                                                        <Slider
                                                            min={1}
                                                            max={30}
                                                            step={1}
                                                            value={[field.value]}
                                                            onValueChange={(vals) => field.onChange(vals[0])}
                                                            className="py-4"
                                                        />
                                                    </FormControl>
                                                    <div className="flex justify-between text-sm text-muted-foreground">
                                                        <span>1 day</span>
                                                        <span>30 days</span>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Step 3: Budget */}
                                    {step === 3 && (
                                        <FormField
                                            control={form.control}
                                            name="budget"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {BUDGET_OPTIONS.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    field.onChange(option.value)
                                                                    nextStep()
                                                                }}
                                                                className={cn(
                                                                    "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50",
                                                                    field.value === option.value
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:bg-secondary/50"
                                                                )}
                                                            >
                                                                <p className="font-semibold mb-1">{option.label}</p>
                                                                <p className="text-xs text-muted-foreground">{option.description}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Step 4: Travelers */}
                                    {step === 4 && (
                                        <div className="space-y-4">
                                            {TRAVELER_TYPES.map((type) => (
                                                <div
                                                    key={type.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background"
                                                >
                                                    <div>
                                                        <p className="font-medium">{type.label}</p>
                                                        <p className="text-sm text-muted-foreground">{type.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full"
                                                            onClick={() => updateTravelerCount(type.id, -1)}
                                                            disabled={travelerCounts[type.id] === 0}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-semibold">
                                                            {travelerCounts[type.id]}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full"
                                                            onClick={() => updateTravelerCount(type.id, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-center text-sm text-muted-foreground">
                                                Total: <span className="font-semibold text-foreground">{form.watch("partySize")} travelers</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Step 5: Pace */}
                                    {step === 5 && (
                                        <FormField
                                            control={form.control}
                                            name="activityLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {PACE_OPTIONS.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    field.onChange(option.value)
                                                                    nextStep()
                                                                }}
                                                                className={cn(
                                                                    "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50",
                                                                    field.value === option.value
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:bg-secondary/50"
                                                                )}
                                                            >
                                                                <p className="font-semibold mb-1">{option.label}</p>
                                                                <p className="text-xs text-muted-foreground">{option.description}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {/* Step 6: Preferences */}
                                    {step === 6 && (
                                        <div className="space-y-6">
                                            {/* Interests */}
                                            <div>
                                                <p className="label mb-3">Interests</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {INTEREST_OPTIONS.map((interest) => {
                                                        const current = form.watch("interests")
                                                        const isSelected = current.includes(interest)
                                                        return (
                                                            <button
                                                                key={interest}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        form.setValue("interests", current.filter((i) => i !== interest))
                                                                    } else {
                                                                        form.setValue("interests", [...current, interest])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background border-border hover:border-primary/50"
                                                                )}
                                                            >
                                                                {interest}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Dietary */}
                                            <div>
                                                <p className="label mb-3">Dietary Needs</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {DIETARY_OPTIONS.map((diet) => {
                                                        const current = form.watch("dietaryRestrictions")
                                                        const isSelected = current.includes(diet)
                                                        return (
                                                            <button
                                                                key={diet}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        form.setValue("dietaryRestrictions", current.filter((d) => d !== diet))
                                                                    } else {
                                                                        form.setValue("dietaryRestrictions", [...current, diet])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background border-border hover:border-primary/50"
                                                                )}
                                                            >
                                                                {diet}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Accessibility */}
                                            <div>
                                                <p className="label mb-3">Accessibility</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {ACCESSIBILITY_OPTIONS.map((need) => {
                                                        const current = form.watch("accessibilityNeeds")
                                                        const isSelected = current.includes(need)
                                                        return (
                                                            <button
                                                                key={need}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        form.setValue("accessibilityNeeds", current.filter((n) => n !== need))
                                                                    } else {
                                                                        form.setValue("accessibilityNeeds", [...current, need])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-background border-border hover:border-primary/50"
                                                                )}
                                                            >
                                                                {need}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <p className="text-center text-sm text-muted-foreground">
                                                All preferences are optional
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    disabled={step === 1 || isLoading}
                                    className={cn("gap-2", step === 1 && "invisible")}
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back
                                </Button>

                                {step < STEPS.length ? (
                                    <Button type="button" onClick={nextStep} className="gap-2 rounded-full px-6">
                                        Next <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="gap-2 rounded-full px-6"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Itinerary
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}
