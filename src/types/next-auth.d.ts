import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            phoneNumber?: string | null
            city?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        name?: string | null
        phoneNumber?: string | null
        city?: string | null
    }
}
