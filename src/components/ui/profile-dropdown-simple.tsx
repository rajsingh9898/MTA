"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LogOut, User, UserCircle } from "lucide-react"
import Link from "next/link"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ProfileDropdownSimple() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const handleSignOut = async () => {
        try {
            await signOut({ redirect: false })
            toast.success("Signed out successfully")
            router.push("/")
        } catch (error) {
            toast.error("Failed to sign out")
        }
    }

    const handleMyProfile = () => {
        router.push("/profile")
    }

    const handleMyTrips = () => {
        router.push("/dashboard")
    }

    // Show loading state
    if (status === "loading") {
        return <div>Loading...</div>
    }

    // Don't show if not authenticated
    if (!session) {
        return null
    }

    const userName = session.user?.email?.split('@')[0] || 'User'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-full hover:bg-accent/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">{userName}</span>
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleMyProfile}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    My Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleMyTrips}>
                    My Trips
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
