"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AdminLogoutButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleLogout() {
        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Logout failed")
            }

            toast.success("Logged out successfully")
            router.push("/admin/login")
            router.refresh()
        } catch (error) {
            console.error("Logout error:", error)
            toast.error("Failed to logout. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            Logout
        </Button>
    )
}
