import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            phoneNumber?: string | null
            city?: string | null
            isAdmin?: boolean
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        name?: string | null
        phoneNumber?: string | null
        city?: string | null
        isAdmin?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        name?: string | null
        phoneNumber?: string | null
        city?: string | null
        isAdmin?: boolean
    }
}
