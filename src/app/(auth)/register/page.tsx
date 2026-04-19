"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { validateCity } from "@/lib/city-validation"

const registerSchema = z.object({
    name: z.string()
        .min(2, "Name is required")
        .max(80, "Name must be at most 80 characters"),
    email: z.string()
        .email("Please enter a valid email")
        .max(64, "Email must be at most 64 characters"),
    phoneNumber: z.string()
        .regex(/^[0-9]+$/, "Phone number must contain only digits")
        .min(10, "Phone number must be at least 10 digits")
        .max(20, "Phone number must be at most 20 digits"),
    city: z.string()
        .min(2, "City is required")
        .max(100, "City name is too long")
        .regex(/^[a-zA-Z\s\-']+$/, "City must contain only letters, spaces, hyphens, and apostrophes"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'register' | 'otp'>('register')
    const [email, setEmail] = useState("")
    const [isCityValidating, setIsCityValidating] = useState(false)
    const [cityValidationStatus, setCityValidationStatus] = useState<{
        valid: boolean
        message?: string
    } | null>(null)

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            city: "",
            password: "",
        },
    })

    const otpForm = useForm<{ otp: string }>({
        defaultValues: { otp: "" },
    })

    const handleCityBlur = async (city: string) => {
        if (!city || city.trim().length < 2) {
            setCityValidationStatus(null)
            return
        }

        setIsCityValidating(true)
        setCityValidationStatus(null)

        const result = await validateCity(city)
        setCityValidationStatus(result)
        setIsCityValidating(false)
    }

    async function onSubmit(data: RegisterFormValues) {
        // Check if city is validated
        if (cityValidationStatus && !cityValidationStatus.valid) {
            toast.error("Please enter a valid city name")
            return
        }

        // If city hasn't been validated yet, validate it now
        if (!cityValidationStatus && data.city) {
            setIsLoading(true)
            const result = await validateCity(data.city)
            setCityValidationStatus(result)
            setIsLoading(false)

            if (!result.valid) {
                toast.error(result.message || "Please enter a valid city name")
                return
            }
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.message || "Registration failed")
            }

            setEmail(responseData.email || data.email)
            setStep('otp')
            toast.success("Account created! Please check your email for OTP.")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Something went wrong. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function onOtpSubmit(data: { otp: string }) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: data.otp }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Verification failed")
            }

            toast.success("Email verified! Please sign in.")
            router.push("/login")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Invalid OTP")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="text-center lg:text-left">
                <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
                    {step === 'register' ? "Create an account" : "Verify your email"}
                </h1>
                <p className="text-muted-foreground">
                    {step === 'register'
                        ? "Start planning your dream trips today"
                        : `Enter the code sent to ${email}`}
                </p>
            </div>

            {/* Form */}
            {step === 'register' ? (
                <>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                maxLength={80}
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">Phone</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="+1234567890"
                                                    maxLength={20}
                                                    disabled={isLoading}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium">City</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="New York"
                                                        maxLength={100}
                                                        disabled={isLoading || isCityValidating}
                                                        {...field}
                                                        onBlur={(e) => handleCityBlur(e.target.value)}
                                                    />
                                                    {isCityValidating && (
                                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                                    )}
                                                    {!isCityValidating && cityValidationStatus && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            {cityValidationStatus.valid ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            {cityValidationStatus && !cityValidationStatus.valid && (
                                                <p className="text-xs text-red-500 mt-1">{cityValidationStatus.message}</p>
                                            )}
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="you@example.com"
                                                type="email"
                                                autoComplete="email"
                                                maxLength={64}
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                autoComplete="new-password"
                                                disabled={isLoading}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </Form>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-foreground font-medium hover:underline underline-offset-4"
                        >
                            Sign in
                        </Link>
                    </p>
                </>
            ) : (
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Input
                            placeholder="Enter 6-digit OTP"
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                            disabled={isLoading}
                            onChange={(e) => otpForm.setValue('otp', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Check your spam folder if you do not see the verification email.
                        </p>
                    </div>
                    <Button
                        onClick={otpForm.handleSubmit(onOtpSubmit)}
                        size="lg"
                        className="w-full rounded-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify Email"
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setStep('register')}
                        disabled={isLoading}
                    >
                        Back
                    </Button>
                </div>
            )}
        </motion.div>
    )
}
