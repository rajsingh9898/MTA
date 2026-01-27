"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { itinerarySchema, ItineraryInput, DIETARY_OPTIONS, ACCESSIBILITY_OPTIONS, INTEREST_OPTIONS } from "@/lib/schemas"
import { Plane, Calendar, Users, Wallet, Activity, MapPin, Loader2, Sparkles, ArrowRight, ArrowLeft, Check, Minus, Plus, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"

import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const STEPS = [
    { id: 1, title: "Destination", icon: MapPin, description: "Where do you want to go?" },
    { id: 2, title: "Duration", icon: Calendar, description: "How long is your trip?" },
    { id: 3, title: "Budget", icon: Wallet, description: "What is your budget?" },
    { id: 4, title: "Travelers", icon: Users, description: "Who is traveling?" },
    { id: 5, title: "Pace", icon: Activity, description: "What is your preferred pace?" },
    { id: 6, title: "Preferences", icon: Heart, description: "Any special requirements?" },
]

const TRAVELER_TYPES = [
    { id: "Adults", label: "Adults", description: "Age 18-64" },
    { id: "Children", label: "Children", description: "Age 0-12" },
    { id: "Teens", label: "Teens", description: "Age 13-17" },
    { id: "Seniors", label: "Seniors", description: "Age 65+" },
] as const

export default function CreateItineraryPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [travelerCounts, setTravelerCounts] = useState<Record<string, number>>({
        "Adults": 1,
        "Children": 0,
        "Teens": 0,
        "Seniors": 0,
    })

    const form = useForm<ItineraryInput>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: {
            destination: "",
            numDays: 3,
            budget: "Moderate",
            ageGroups: ["Adults"],
            partySize: 1,
            activityLevel: "Moderate",
            dietaryRestrictions: [],
            accessibilityNeeds: [],
            interests: [],
        },
    })

    // Update form values when traveler counts change
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            case 1: fieldsToValidate.push("destination"); break;
            case 2: fieldsToValidate.push("numDays"); break;
            case 3: fieldsToValidate.push("budget"); break;
            case 4: fieldsToValidate.push("ageGroups", "partySize"); break;
            case 5: fieldsToValidate.push("activityLevel"); break;
            case 6: break; // Optional preferences, no validation needed
        }

        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) {
            setStep((prev) => Math.min(prev + 1, STEPS.length))
        }
    }

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1))
    }

    async function onSubmit(data: ItineraryInput) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const text = await response.text()
                try {
                    const error = JSON.parse(text)
                    throw new Error(error.error || error.message || "Failed to generate itinerary")
                } catch (e: any) {
                    throw new Error(e.message || `API returned ${response.status}`)
                }
            }

            const result = await response.json()
            toast.success("Itinerary generated successfully!")
            router.push(`/itinerary/${result.itineraryId}`)
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Something went wrong. Please try again.")
            }
            setIsLoading(false)
        }
    }

    const updateTravelerCount = (type: string, delta: number) => {
        setTravelerCounts(prev => {
            const current = prev[type] || 0
            const newValue = Math.max(0, current + delta)

            // Ensure at least one person total
            const otherTotal = Object.entries(prev)
                .filter(([k]) => k !== type)
                .reduce((sum, [_, val]) => sum + val, 0)

            if (newValue === 0 && otherTotal === 0) return prev

            return { ...prev, [type]: newValue }
        })
    }

    const CurrentIcon = STEPS[step - 1].icon

    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-background to-cyan-500/5 dark:from-teal-900/20 dark:via-background dark:to-cyan-900/20 -z-10" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 -z-10" />

            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="mb-8 p-6 bg-primary/10 rounded-full"
                        >
                            <Plane className="w-12 h-12 text-primary" />
                        </motion.div>
                        <motion.h2
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                        >
                            Crafting your perfect trip to {form.getValues("destination")}...
                        </motion.h2>
                        <p className="text-muted-foreground">
                            Analyzing thousands of reviews and local favorites
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className="w-full max-w-2xl shadow-2xl border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / STEPS.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <CardHeader className="text-center space-y-2 pb-8 pt-8">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        {CurrentIcon && <CurrentIcon className="w-6 h-6 text-primary" />}
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {STEPS[step - 1].title}
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
                        {STEPS[step - 1].description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="min-h-[300px] flex flex-col justify-center">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    {step === 1 && (
                                        <FormField
                                            control={form.control}
                                            name="destination"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Kyoto, Japan"
                                                            className="h-16 text-xl text-center bg-background/50 border-2 focus-visible:ring-0 focus-visible:border-primary transition-all"
                                                            autoFocus
                                                            {...field}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    nextStep();
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-center mt-2" />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {step === 2 && (
                                        <FormField
                                            control={form.control}
                                            name="numDays"
                                            render={({ field }) => (
                                                <FormItem className="space-y-8">
                                                    <div className="text-center text-6xl font-bold text-primary">
                                                        {field.value} <span className="text-2xl text-muted-foreground font-normal">Days</span>
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
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {step === 3 && (
                                        <FormField
                                            control={form.control}
                                            name="budget"
                                            render={({ field }) => (
                                                <FormItem>
                                                    {/* Info banner */}
                                                    <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                                                        <p className="text-sm text-muted-foreground">
                                                            <span className="font-semibold text-primary">💡 Tip:</span> Costs will be calculated based on your destination. The AI recommends options within your selected budget tier.
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {[
                                                            { value: "Budget-Friendly", label: "Budget Friendly", icon: "💰", description: "Hostels, street food, public transport, free attractions" },
                                                            { value: "Moderate", label: "Moderate", icon: "💰💰", description: "Mid-range hotels, local restaurants, mix of transport" },
                                                            { value: "Luxury", label: "Luxury", icon: "💰💰💰", description: "Premium hotels, fine dining, private transfers" },
                                                            { value: "No Limit", label: "No Limit", icon: "💳", description: "The best of everything, money is no object" },
                                                        ].map((option) => (
                                                            <div
                                                                key={option.value}
                                                                className={cn(
                                                                    "cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50 hover:bg-primary/5",
                                                                    field.value === option.value ? "border-primary bg-primary/10" : "border-border bg-card"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(option.value)
                                                                    nextStep()
                                                                }}
                                                            >
                                                                <div className="text-3xl mb-2">{option.icon}</div>
                                                                <div className="font-semibold">{option.label}</div>
                                                                <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {step === 4 && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                {TRAVELER_TYPES.map((type) => (
                                                    <div key={type.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                                                        <div>
                                                            <div className="font-semibold">{type.label}</div>
                                                            <div className="text-sm text-muted-foreground">{type.description}</div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
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
                                                            <span className="w-8 text-center font-semibold text-lg">
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
                                            </div>
                                            <div className="text-center text-sm text-muted-foreground">
                                                Total Party Size: <span className="font-bold text-primary">{form.watch("partySize")}</span>
                                            </div>
                                        </div>
                                    )}

                                    {step === 5 && (
                                        <FormField
                                            control={form.control}
                                            name="activityLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {[
                                                            { value: "Relaxed", label: "Relaxed", icon: "😌", desc: "Take it easy" },
                                                            { value: "Moderate", label: "Moderate", icon: "🚶", desc: "Balanced pace" },
                                                            { value: "Active", label: "Active", icon: "🏃", desc: "Packed schedule" },
                                                            { value: "Very Active", label: "Very Active", icon: "⚡", desc: "Non-stop action" },
                                                        ].map((option) => (
                                                            <div
                                                                key={option.value}
                                                                className={cn(
                                                                    "cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50 hover:bg-primary/5",
                                                                    field.value === option.value ? "border-primary bg-primary/10" : "border-border bg-card"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(option.value)
                                                                    nextStep()
                                                                }}
                                                            >
                                                                <div className="text-3xl mb-2">{option.icon}</div>
                                                                <div className="font-semibold">{option.label}</div>
                                                                <div className="text-sm text-muted-foreground">{option.desc}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {step === 6 && (
                                        <div className="space-y-6">
                                            {/* Interests */}
                                            <div>
                                                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Interests (Optional)</h3>
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
                                                                        form.setValue("interests", current.filter(i => i !== interest))
                                                                    } else {
                                                                        form.setValue("interests", [...current, interest])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-primary text-primary-foreground border-primary"
                                                                        : "bg-card border-border hover:border-primary/50"
                                                                )}
                                                            >
                                                                {interest}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Dietary Restrictions */}
                                            <div>
                                                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Dietary Needs (Optional)</h3>
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
                                                                        form.setValue("dietaryRestrictions", current.filter(d => d !== diet))
                                                                    } else {
                                                                        form.setValue("dietaryRestrictions", [...current, diet])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-green-600 text-white border-green-600"
                                                                        : "bg-card border-border hover:border-green-500/50"
                                                                )}
                                                            >
                                                                {diet}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Accessibility Needs */}
                                            <div>
                                                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Accessibility (Optional)</h3>
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
                                                                        form.setValue("accessibilityNeeds", current.filter(n => n !== need))
                                                                    } else {
                                                                        form.setValue("accessibilityNeeds", [...current, need])
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                    isSelected
                                                                        ? "bg-blue-600 text-white border-blue-600"
                                                                        : "bg-card border-border hover:border-blue-500/50"
                                                                )}
                                                            >
                                                                {need}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <p className="text-center text-sm text-muted-foreground">
                                                Skip if none apply - you can always adjust later!
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter className="flex justify-between pt-8">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || isLoading}
                        className={cn("gap-2", step === 1 && "invisible")}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>

                    {step < STEPS.length ? (
                        <Button onClick={nextStep} className="gap-2 bg-primary hover:bg-primary/90">
                            Next <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isLoading}
                            className="gap-2 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90"
                        >
                            {isLoading ? (
                                <>Generating...</>
                            ) : (
                                <>Generate Itinerary <Sparkles className="w-4 h-4" /></>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
