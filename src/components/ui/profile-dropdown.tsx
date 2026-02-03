"use client"

import * as React from "react"
import { LogOut, UserCircle, Calendar, ChevronRight } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ProfileTrigger } from "@/components/ui/profile-trigger"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ProfileDropdownProps {
    className?: string
}

export function ProfileDropdown({ className }: ProfileDropdownProps) {
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

    // Show loading state while session is loading
    if (status === "loading") {
        return (
            <Button variant="ghost" size="icon" className={cn("rounded-full relative", className)}>
                <div className="flex items-center justify-center w-full h-full rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="sr-only">Loading profile</span>
            </Button>
        )
    }

    // Don't show if not authenticated
    if (!session) {
        return null
    }

    // Extract user name from email
    const userName = session.user?.email?.split('@')[0] || 'User'
    const userAvatar = session.user?.image || null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <ProfileTrigger className={className}>
                    <span className="sr-only">Profile menu</span>
                </ProfileTrigger>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
                align="end" 
                className="w-64 md:w-72 p-0 bg-popover/95 backdrop-blur-sm border-border/50 rounded-lg shadow-lg"
                sideOffset={8}
            >
                {/* Profile Header */}
                <div className="p-3 md:p-4 border-b border-border/30">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative">
                            {userAvatar ? (
                                <div className="w-8 h-8 md:w-10 md:h-10 overflow-hidden rounded-full">
                                    <img 
                                        src={userAvatar} 
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = ""
                                            e.currentTarget.style.display = "flex"
                                            e.currentTarget.innerHTML = '<UserCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground m-auto" />'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10">
                                    <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                </div>
                            )}
                            {userAvatar && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {session.user?.email || 'No email'}
                            </p>
                        </div>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-border/30" />

                {/* Menu Items */}
                <div className="p-1">
                    <DropdownMenuItem 
                        className="flex items-center gap-2 md:gap-3 p-2 hover:bg-accent/50 transition-colors rounded-md"
                        onSelect={handleMyProfile}
                    >
                        <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">My Profile</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                        className="flex items-center gap-2 md:gap-3 p-2 hover:bg-accent/50 transition-colors rounded-md"
                        onSelect={handleMyTrips}
                    >
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">My Trips</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-border/30" />

                {/* Sign Out */}
                <div className="p-1">
                    <DropdownMenuItem 
                        className="flex items-center gap-2 md:gap-3 p-2 hover:bg-destructive/10 text-destructive transition-colors rounded-md"
                        onSelect={handleSignOut}
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">Sign Out</span>
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ProfileDropdown
