"use client"

import * as React from "react"
import { User, UserCircle } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"

interface ProfileTriggerProps {
    className?: string
    children: React.ReactNode
}

export function ProfileTrigger({ className, children }: ProfileTriggerProps) {
    const { data: session, status } = useSession()

    // Show loading state while session is loading
    if (status === "loading") {
        return (
            <div className={cn("rounded-full relative", className)}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="sr-only">Loading profile</span>
            </div>
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
        <div 
            className={cn(
                "rounded-full relative transition-all duration-200 hover:bg-accent/50 h-auto p-1.5 md:p-2 cursor-pointer",
                className
            )}
        >
            <div className="flex items-center gap-1.5 md:gap-2">
                {/* Avatar */}
                <div className="relative">
                    {userAvatar ? (
                        <div className="w-7 h-7 md:w-8 md:h-8 overflow-hidden rounded-full">
                            <img 
                                src={userAvatar} 
                                alt={userName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = ""
                                    e.currentTarget.style.display = "flex"
                                    e.currentTarget.innerHTML = '<UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground m-auto" />'
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                            <UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                        </div>
                    )}
                    {userAvatar && (
                        <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                </div>

                {/* Username - Desktop only */}
                <span className="hidden md:block text-sm font-medium text-foreground max-w-[80px] md:max-w-[100px] truncate">
                    {userName}
                </span>
            </div>
            
            {children}
        </div>
    )
}
