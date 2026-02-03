"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, LogOut, UserCircle, Calendar, ChevronRight, Edit2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { profileStorage } from "@/lib/profile-storage"

export function ProfileTest() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [profileData, setProfileData] = useState<any>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Load profile data
    useEffect(() => {
        if (session) {
            const savedProfile = profileStorage.get()
            setProfileData(savedProfile)
        }
    }, [session])

    // Also update when profile data changes (real-time sync)
    useEffect(() => {
        const handleStorageChange = () => {
            const savedProfile = profileStorage.get()
            setProfileData(savedProfile)
        }

        // Listen for storage changes (from other tabs)
        window.addEventListener('storage', handleStorageChange)
        
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    const handleSignOut = async () => {
        setIsOpen(false)
        try {
            const { signOut } = await import("next-auth/react")
            await signOut({ redirect: false })
            router.push("/")
        } catch (error) {
            console.error("Sign out error:", error)
        }
    }

    const handleMyProfile = () => {
        setIsOpen(false)
        setTimeout(() => router.push("/profile"), 150)
    }

    const handleMyTrips = () => {
        setIsOpen(false)
        setTimeout(() => router.push("/dashboard"), 150)
    }

    const handleQuickEdit = () => {
        const currentName = profileData?.firstName || session?.user?.email?.split('@')[0] || 'User'
        const newName = prompt("Enter your name:", currentName)
        if (newName && newName.trim()) {
            const updatedProfile = {
                ...profileData,
                firstName: newName.trim()
            }
            profileStorage.save(updatedProfile)
            setProfileData(updatedProfile)
        }
        setIsOpen(false)
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    // Show loading state
    if (status === "loading") {
        return (
            <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    // Don't show if not authenticated
    if (!session) {
        return null
    }

    // Use saved profile data or fallback to email username
    const userName = profileData?.firstName || session.user?.email?.split('@')[0] || 'User'
    const fullName = profileData?.firstName && profileData?.lastName 
        ? `${profileData.firstName} ${profileData.lastName}` 
        : userName

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <motion.button 
                className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-full hover:bg-accent/50 transition-all duration-200 relative"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <div className="relative">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                    </div>
                    <motion.div 
                        className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
                <span className="hidden md:block text-sm font-medium text-foreground max-w-[80px] md:max-w-[100px] truncate">
                    {userName}
                </span>
                
                {/* Dropdown indicator */}
                <motion.div 
                    className={`hidden md:block transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ 
                                duration: 0.2, 
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-popover/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                            {/* Profile Header */}
                            <div className="p-3 md:p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <motion.div 
                                        className="relative"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                        </div>
                                        <motion.div 
                                            className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {fullName}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {session.user?.email}
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={handleQuickEdit}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-1.5 rounded-full hover:bg-accent/50 transition-colors"
                                        title="Quick edit name"
                                    >
                                        <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <motion.button 
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 md:gap-3 group"
                                    onClick={handleMyProfile}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="font-medium">My Profile</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                                </motion.button>

                                <motion.button 
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors flex items-center gap-2 md:gap-3 group"
                                    onClick={handleMyTrips}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="font-medium">My Trips</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                                </motion.button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-border/30 my-1" />

                            {/* Sign Out */}
                            <div className="py-1">
                                <motion.button 
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 md:gap-3 group"
                                    onClick={handleSignOut}
                                    whileHover={{ x: 4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="font-medium">Sign Out</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
