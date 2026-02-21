import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: {
        strategy: "jwt",
        maxAge: 48 * 60 * 60, // 48 hours
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
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    return null
                }

                if (!user.isVerified) {
                    throw new Error("Please verify your email address")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phoneNumber: user.phoneNumber,
                    city: user.city,
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
            }
            return session
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.phoneNumber = user.phoneNumber
                token.city = user.city
            }

            // Handle session updates (e.g., when a user updates their profile)
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name
                if (session.phoneNumber !== undefined) token.phoneNumber = session.phoneNumber
                if (session.city !== undefined) token.city = session.city
            }

            return token
        },
    },
})
