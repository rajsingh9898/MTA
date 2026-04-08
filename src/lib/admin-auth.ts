import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key"

export interface AdminTokenPayload {
    username: string
    role: string
    iat: number
    exp: number
}

export async function verifyAdminToken(): Promise<AdminTokenPayload | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("admin_token")?.value

        if (!token) {
            return null
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload
        return decoded
    } catch (error) {
        console.error("Token verification error:", error)
        return null
    }
}

export function isValidAdminToken(token: string): AdminTokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload
        return decoded
    } catch (error) {
        console.error("Token verification error:", error)
        return null
    }
}
