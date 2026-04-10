"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface OtpVerificationProps {
  email: string
  type: "ACCOUNT_CREATION" | "PASSWORD_RESET" | "GENERAL"
  onVerified: (success: boolean) => void
  onResend?: () => void
  isLoading?: boolean
}

export function OtpVerification({ 
  email, 
  type, 
  onVerified, 
  onResend,
  isLoading = false 
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [remainingTime, setRemainingTime] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: otp,
          type
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success("OTP verified successfully!")
        onVerified(true)
      } else {
        toast.error(result.message)
        onVerified(false)
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.")
      onVerified(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success("OTP resent successfully!")
        if (onResend) onResend()
        
        // Start cooldown timer
        setCanResend(false)
        setRemainingTime(600) // 10 minutes in seconds
        const timer = setInterval(() => {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              setCanResend(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Enter OTP Code
          </label>
          <Input
            id="otp"
            type="text"
            maxLength={6}
            pattern="[0-9]{6}"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-2xl tracking-widest"
            disabled={isLoading || isSubmitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isSubmitting || otp.length !== 6}
        >
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the code?
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={!canResend || isSubmitting || isLoading}
        >
          {canResend ? "Resend OTP" : `Resend in ${formatTime(remainingTime)}`}
        </Button>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        <p>• OTP is valid for 10 minutes</p>
        <p>• Check your spam folder if you don't see it</p>
        <p>• You can request a new OTP after 10 minutes</p>
      </div>
    </div>
  )
}
