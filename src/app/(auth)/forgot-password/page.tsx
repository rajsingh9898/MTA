"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Schema for Step 1: Email
const emailSchema = z.object({
    email: z.string().email("Please enter a valid email"),
})

// Schema for Step 2: OTP + New Password
const resetSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type EmailFormValues = z.infer<typeof emailSchema>
type ResetFormValues = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<"email" | "reset">("email")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Form 1: Email
    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    })

    // Form 2: Reset
    const resetForm = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { otp: "", password: "", confirmPassword: "" },
    })

    async function onEmailSubmit(data: EmailFormValues) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || "Failed to send reset code")
            }

            setEmail(data.email)
            setStep("reset")
            toast.success("Verification code sent to your email")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    async function onResetSubmit(data: ResetFormValues) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp: data.otp,
                    newPassword: data.password,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || "Failed to reset password")
            }

            toast.success("Password reset successfully. Please login.")
            router.push("/login")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <Link
                href="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
            </Link>

            <AnimatePresence mode="wait">
                {step === "email" ? (
                    <motion.div
                        key="email-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
                            <p className="text-muted-foreground text-sm">
                                Enter your email address and we&apos;ll send you a verification code to reset your password.
                            </p>
                        </div>

                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@example.com" type="email" disabled={isLoading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending code...
                                        </>
                                    ) : (
                                        "Send Verification Code"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="reset-step"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
                            <p className="text-muted-foreground text-sm">
                                Enter the verification code sent to <strong>{email}</strong> and your new password.
                            </p>
                        </div>

                        <Form {...resetForm}>
                            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                                <FormField
                                    control={resetForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Verification Code</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="123456"
                                                        maxLength={6}
                                                        className="tracking-widest text-center text-lg md:text-xl font-mono"
                                                        disabled={isLoading}
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Check your email for the 6-digit code.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={resetForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="New password"
                                                        disabled={isLoading}
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={resetForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Confirm new password"
                                                        disabled={isLoading}
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resetting password...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
