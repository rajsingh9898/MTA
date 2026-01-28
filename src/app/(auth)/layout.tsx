"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mountain } from "lucide-react"

const images = [
    {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
        location: "Swiss Alps",
        photographer: "Samuel Ferrara",
    },
    {
        url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
        location: "Lake Bled, Slovenia",
        photographer: "Luca Bravo",
    },
    {
        url: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2070&auto=format&fit=crop",
        location: "Bali, Indonesia",
        photographer: "Colin Watts",
    },
]

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [currentImage, setCurrentImage] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Image (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted">
                {/* Images */}
                {mounted && images.map((img, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentImage ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <Image
                            src={img.url}
                            alt={img.location}
                            fill
                            className="object-cover"
                            priority={idx === 0}
                        />
                    </div>
                ))}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-10">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 text-white">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                            <Mountain className="w-5 h-5" />
                        </div>
                        <span className="font-display text-2xl font-semibold tracking-tight">
                            MTA
                        </span>
                    </Link>

                    {/* Bottom Content */}
                    <div className="text-white">
                        <p className="text-white/60 text-sm mb-2">
                            {mounted ? images[currentImage].photographer : ""}
                        </p>
                        <h2 className="font-display text-4xl font-semibold tracking-tight mb-4">
                            {mounted ? images[currentImage].location : ""}
                        </h2>
                        <p className="text-white/80 text-lg max-w-md">
                            Plan your next adventure with AI-powered itineraries tailored just for you.
                        </p>

                        {/* Image Indicators */}
                        <div className="flex gap-2 mt-6">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImage(idx)}
                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentImage
                                            ? "w-8 bg-white"
                                            : "w-4 bg-white/40 hover:bg-white/60"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-background relative">
                {/* Mobile Logo */}
                <Link
                    href="/"
                    className="absolute top-6 left-6 flex items-center gap-2 lg:hidden"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Mountain className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-display text-xl font-semibold tracking-tight">
                        MTA
                    </span>
                </Link>

                {/* Form Container */}
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    )
}
