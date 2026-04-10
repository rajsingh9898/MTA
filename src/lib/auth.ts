import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { env } from "@/lib/env"
import { enforceAuthRateLimit, logSecurityEvent, detectSuspiciousActivity } from "@/middleware/auth-security"
import { checkAccountLockout, recordFailedLogin, clearFailedAttempts, getLockoutMessage } from "@/lib/security/account-lockout"

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 48 * 60 * 60, // 48 hours
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 48 * 60 * 60, // 48 hours
            },
        },
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                try {
                    const email = credentials?.email as string
                    
                    // Input validation
                    if (!credentials?.email || !credentials?.password) {
                        logSecurityEvent("LOGIN_MISSING_CREDENTIALS", { email }, req)
                        return null
                    }

                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(email)) {
                        logSecurityEvent("LOGIN_INVALID_EMAIL", { email }, req)
                        return null
                    }

                    // Check account lockout
                    const lockoutStatus = await checkAccountLockout(email)
                    if (lockoutStatus.locked) {
                        logSecurityEvent("LOGIN_ACCOUNT_LOCKED", { email }, req)
                        throw new Error(getLockoutMessage(lockoutStatus.remainingTime))
                    }

                    // Check for suspicious activity
                    if (detectSuspiciousActivity(req, "LOGIN")) {
                        await recordFailedLogin(email)
                        return null
                    }

                    const user = await prisma.user.findUnique({
                        where: {
                            email,
                        },
                    })

                    if (!user) {
                        logSecurityEvent("LOGIN_USER_NOT_FOUND", { email }, req)
                        await recordFailedLogin(email)
                        // Add artificial delay to prevent timing attacks
                        await new Promise(resolve => setTimeout(resolve, 1000))
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password as string,
                        user.passwordHash
                    )

                    if (!isPasswordValid) {
                        logSecurityEvent("LOGIN_INVALID_PASSWORD", { 
                            email, 
                            userId: user.id 
                        }, req)
                        await recordFailedLogin(email)
                        // Add artificial delay to prevent timing attacks
                        await new Promise(resolve => setTimeout(resolve, 1000))
                        return null
                    }

                    if (!user.isVerified) {
                        logSecurityEvent("LOGIN_UNVERIFIED_EMAIL", { 
                            email: credentials.email, 
                            userId: user.id 
                        }, req)
                        throw new Error("Please verify your email address")
                    }

                    logSecurityEvent("LOGIN_SUCCESS", { 
                        email, 
                        userId: user.id,
                        isAdmin: user.isAdmin 
                    }, req)

                    // Clear failed attempts on successful login
                    await clearFailedAttempts(email)

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phoneNumber: user.phoneNumber,
                        city: user.city,
                        isAdmin: user.isAdmin,
                    }
                } catch (error) {
                    logSecurityEvent("LOGIN_ERROR", { 
                        email: credentials?.email,
                        error: error instanceof Error ? error.message : "Unknown error"
                    }, req)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.name = token.name as string
                session.user.phoneNumber = token.phoneNumber as string
                session.user.city = token.city as string
                session.user.isAdmin = token.isAdmin as boolean
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.phoneNumber = user.phoneNumber
                token.city = user.city
                token.isAdmin = user.isAdmin
            }

            // Handle session updates (e.g., when a user updates their profile)
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name
                if (session.phoneNumber !== undefined) token.phoneNumber = session.phoneNumber
                if (session.city !== undefined) token.city = session.city
                if (session.isAdmin !== undefined) token.isAdmin = session.isAdmin
            }

            return token
        },
    },
})
