"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ProfileTest } from "@/components/ui/profile-test"
import { cn } from "@/lib/utils"

export function Navbar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)

    // Conditionally render navigation links based on authentication
    const navLinks = React.useMemo(() => {
        const links = [
            { href: "/", label: "Home" },
            { href: "/create", label: "Create Trip" },
        ]

        // Only add Dashboard link if user is authenticated
        if (session) {
            links.splice(1, 0, { href: "/dashboard", label: "Dashboard" })
        }

        return links
    }, [session])

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    "bg-[#D1FFFF]/60 backdrop-blur-md border-b border-white/20 shadow-sm text-foreground"
                )}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 group"
                        >
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                <img
                                    src="/mta.jpeg"
                                    alt="MTA Logo"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <span className="font-display text-xl font-semibold tracking-tight">
                                MTA
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium transition-colors",
                                        pathname === link.href
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {link.label}
                                    {pathname === link.href && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary rounded-full"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Profile Dropdown */}
                            <ProfileTest />



                            {/* Mobile Menu Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden rounded-full"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background md:hidden"
                    >
                        <div className="flex flex-col h-full p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                                        <img
                                            src="/mta.jpeg"
                                            alt="MTA Logo"
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <span className="font-display text-xl font-semibold tracking-tight">
                                        MTA
                                    </span>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Links */}
                            <div className="flex flex-col gap-2 mt-12">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                "block text-3xl font-display font-medium py-3 transition-colors",
                                                pathname === link.href
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>


                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spacer for fixed navbar */}
            <div className="h-16" />
        </>
    )
}

export default Navbar
