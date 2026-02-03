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
            <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
                {/* Travel-themed background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-cream-50 to-yellow-50" />
                <div 
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='400' viewBox='0 0 800 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2378716C' stroke-width='0.5' fill-opacity='0.1'%3E%3Cpath d='M100 200 Q200 150 300 200 T500 200 Q600 150 700 200'/%3E%3Cpath d='M150 180 Q250 130 350 180 T550 180'/%3E%3Cpath d='M200 220 Q300 270 400 220 T600 220'/%3E%3Ccircle cx='200' cy='180' r='3' fill='%2378716C'/%3E%3Ccircle cx='400' cy='200' r='3' fill='%2378716C'/%3E%3Ccircle cx='600' cy='180' r='3' fill='%2378716C'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '800px 400px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'repeat',
                    }}
                />
                
                {/* Mobile Logo */}
                <Link
                    href="/"
                    className="absolute top-6 left-6 flex items-center gap-2 lg:hidden z-10"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Mountain className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-display text-xl font-semibold tracking-tight">
                        MTA
                    </span>
                </Link>

                <div className="relative z-10 w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    )
}
