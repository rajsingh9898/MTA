import { prisma } from "@/lib/prisma"

interface FailedLoginAttempt {
  email: string
  attempts: number
  lastAttempt: Date
  lockUntil?: Date
}

// In-memory storage for failed attempts (in production, use Redis or database)
const failedAttempts = new Map<string, FailedLoginAttempt>()

// Lockout settings
const LOCKOUT_SETTINGS = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes window to count attempts
}

export async function checkAccountLockout(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date()
  
  // Check in-memory storage first
  const memoryAttempt = failedAttempts.get(normalizedEmail)
  if (memoryAttempt) {
    // Reset if lockout period has expired
    if (memoryAttempt.lockUntil && memoryAttempt.lockUntil <= now) {
      failedAttempts.delete(normalizedEmail)
      return { locked: false }
    }
    
    // Check if currently locked
    if (memoryAttempt.lockUntil && memoryAttempt.lockUntil > now) {
      const remainingTime = Math.ceil((memoryAttempt.lockUntil.getTime() - now.getTime()) / 1000)
      return { locked: true, remainingTime }
    }
  }

  // Check database for persistent lockout
  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { 
        id: true,
        // You might want to add lockout fields to your User model
        // lockedUntil: true,
        // failedLoginAttempts: true
      }
    })

    if (user) {
      // For now, we'll use in-memory storage
      // In production, you'd check user.lockedUntil from database
      return { locked: false }
    }
  } catch (error) {
    console.error('Error checking account lockout:', error)
  }

  return { locked: false }
}

export async function recordFailedLogin(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date()
  
  let attempt = failedAttempts.get(normalizedEmail)
  
  if (!attempt) {
    attempt = {
      email: normalizedEmail,
      attempts: 0,
      lastAttempt: now
    }
  }
  
  // Reset attempts if window has expired
  if (now.getTime() - attempt.lastAttempt.getTime() > LOCKOUT_SETTINGS.ATTEMPT_WINDOW) {
    attempt.attempts = 0
  }
  
  attempt.attempts++
  attempt.lastAttempt = now
  
  // Lock account if max attempts reached
  if (attempt.attempts >= LOCKOUT_SETTINGS.MAX_ATTEMPTS) {
    attempt.lockUntil = new Date(now.getTime() + LOCKOUT_SETTINGS.LOCKOUT_DURATION)
    
    // Log security event
    console.warn(`[SECURITY] Account locked: ${normalizedEmail} after ${attempt.attempts} failed attempts`)
  }
  
  failedAttempts.set(normalizedEmail, attempt)
  
  // In production, you'd also update the database
  // await prisma.user.update({
  //   where: { email: normalizedEmail },
  //   data: {
  //     failedLoginAttempts: attempt.attempts,
  //     lockedUntil: attempt.lockUntil
  //   }
  // })
}

export async function clearFailedAttempts(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim()
  failedAttempts.delete(normalizedEmail)
  
  // In production, you'd also update the database
  // await prisma.user.update({
  //   where: { email: normalizedEmail },
  //   data: {
  //     failedLoginAttempts: 0,
  //     lockedUntil: null
  //   }
  // })
}

export function getLockoutMessage(remainingTime?: number): string {
  if (!remainingTime) return "Account temporarily locked due to too many failed attempts. Please try again later."
  
  const minutes = Math.ceil(remainingTime / 60)
  if (minutes <= 1) {
    return "Account temporarily locked. Please try again in 1 minute."
  }
  
  return `Account temporarily locked. Please try again in ${minutes} minutes.`
}

// Cleanup function to remove expired entries (call this periodically)
export function cleanupExpiredLockouts(): void {
  const now = new Date()
  for (const [email, attempt] of failedAttempts.entries()) {
    if (attempt.lockUntil && attempt.lockUntil <= now) {
      failedAttempts.delete(email)
    }
  }
}
