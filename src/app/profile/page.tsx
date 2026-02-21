"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Globe,
    Save,
    Bell,
    Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { profileStorage } from "@/lib/profile-storage"

export default function ProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [bio, setBio] = useState("")
    const [phone, setPhone] = useState("")
    const [location, setLocation] = useState("")
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [pushNotifications, setPushNotifications] = useState(true)

    useEffect(() => {
        if (session?.user) {
            const nameParts = (session.user.name || "").split(" ")
            setFirstName(nameParts[0] || "")
            setLastName(nameParts.slice(1).join(" ") || "")
            setBio("Passionate traveler exploring the world one destination at a time.")
            setPhone(session.user.phoneNumber || "")
            setLocation(session.user.city || "")
        }
    }, [session])

    const onSubmit = async () => {
        setIsSaving(true)
        setSaveSuccess(false)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    location
                })
            })

            if (res.ok) {
                // Force NextAuth to pull the latest db values into the session cookie
                await update({
                    name: [firstName, lastName].filter(Boolean).join(" "),
                    phoneNumber: phone,
                    city: location
                })

                setSaveSuccess(true)
                // Hide success message after 3 seconds
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                console.error('Failed to save profile')
            }
        } catch (error) {
            console.error('Error saving profile:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!session) {
        router.push("/login")
        return null
    }

    return (
        <div className="min-h-screen relative">
            {/* Travel-themed background */}
            <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-cream-50 to-yellow-50" />
            <div
                className="fixed inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='400' viewBox='0 0 800 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2378716C' stroke-width='0.5' fill-opacity='0.1'%3E%3Cpath d='M100 200 Q200 150 300 200 T500 200 Q600 150 700 200'/%3E%3Cpath d='M150 180 Q250 130 350 180 T550 180'/%3E%3Cpath d='M200 220 Q300 270 400 220 T600 220'/%3E%3Ccircle cx='200' cy='180' r='3' fill='%2378716C'/%3E%3Ccircle cx='400' cy='200' r='3' fill='%2378716C'/%3E%3Ccircle cx='600' cy='180' r='3' fill='%2378716C'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '800px 400px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your personal information and preferences</p>
                </motion.div>

                <div className="grid gap-6">
                    {/* Personal Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal details and profile information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">


                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                    />
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="New York, USA"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex items-center gap-2">
                                    <Button onClick={onSubmit} disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>

                                    {saveSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-2 text-green-600"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="text-sm font-medium">Saved!</span>
                                        </motion.div>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* Notifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications}
                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Push Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive push notifications</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={pushNotifications}
                                        onChange={(e) => setPushNotifications(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
