import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
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
                        email: credentials.email,
                    },
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!isPasswordValid) {
                    return null
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
            if (token) {
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.name = token.name as string
                session.user.phoneNumber = token.phoneNumber as string
                session.user.city = token.city as string
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.phoneNumber = user.phoneNumber
                token.city = user.city
            }
            return token
        },
    },
}
