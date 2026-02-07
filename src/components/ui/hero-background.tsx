"use client"

import * as React from "react"

export function HeroBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Satin white gradient background */}
            {/* Transparent background to show global theme */}
            <div className="absolute inset-0 bg-transparent" />

            {/* Subtle world map texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='800' height='400' viewBox='0 0 800 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2378716C' stroke-width='0.5' fill-opacity='0.1'%3E%3Cpath d='M100 200 Q200 150 300 200 T500 200 Q600 150 700 200'/%3E%3Cpath d='M150 180 Q250 130 350 180 T550 180'/%3E%3Cpath d='M200 220 Q300 270 400 220 T600 220'/%3E%3Ccircle cx='200' cy='180' r='3' fill='%2378716C'/%3E%3Ccircle cx='400' cy='200' r='3' fill='%2378716C'/%3E%3Ccircle cx='600' cy='180' r='3' fill='%2378716C'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '800px 400px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Travel landmarks along the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-48">
                <svg
                    viewBox="0 0 1200 200"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMax meet"
                >
                    {/* Statue of Liberty */}
                    <g transform="translate(50, 120)">
                        <path
                            d="M15 80 L15 40 L12 35 L18 35 L15 40 M10 85 L20 85 M8 90 L22 90 M6 95 L24 95"
                            stroke="#8B7355"
                            strokeWidth="2"
                            fill="none"
                        />
                        <circle cx="15" cy="25" r="8" fill="#8B7355" opacity="0.8" />
                        <path d="M15 33 L15 80" stroke="#8B7355" strokeWidth="3" />
                        <path d="M5 40 L25 40 L20 45 L10 45 Z" fill="#8B7355" opacity="0.6" />
                    </g>

                    {/* Eiffel Tower */}
                    <g transform="translate(200, 100)">
                        <path
                            d="M20 100 L20 20 L15 10 L25 10 L20 20 M10 100 L30 100 M5 100 L35 100 M15 40 L25 40 M12 60 L28 60"
                            stroke="#6B7280"
                            strokeWidth="2"
                            fill="none"
                        />
                        <path d="M20 10 L10 30 L30 30 Z" fill="#6B7280" opacity="0.7" />
                        <path d="M15 30 L25 30 L22 40 L18 40 Z" fill="#6B7280" opacity="0.5" />
                    </g>

                    {/* Big Ben */}
                    <g transform="translate(350, 90)">
                        <rect x="15" y="40" width="20" height="60" fill="#8B7D6B" opacity="0.8" />
                        <rect x="17" y="20" width="16" height="25" fill="#8B7D6B" opacity="0.9" />
                        <circle cx="25" cy="32" r="6" fill="#F3F4F6" stroke="#8B7D6B" strokeWidth="1" />
                        <path d="M25 26 L25 38 M19 32 L31 32" stroke="#8B7D6B" strokeWidth="1" />
                        <rect x="20" y="10" width="10" height="15" fill="#8B7D6B" />
                        <path d="M18 10 L32 10 L30 5 L20 5 Z" fill="#8B7D6B" />
                    </g>

                    {/* Taj Mahal */}
                    <g transform="translate(500, 110)">
                        <path d="M25 80 L10 60 L40 60 Z" fill="#E8D5C4" opacity="0.8" />
                        <rect x="15" y="50" width="20" height="30" fill="#E8D5C4" opacity="0.9" />
                        <circle cx="25" cy="45" r="12" fill="#E8D5C4" />
                        <rect x="20" y="35" width="10" height="15" fill="#E8D5C4" />
                        <path d="M15 45 L35 45" stroke="#D4A574" strokeWidth="1" />
                        <path d="M25 35 L25 50" stroke="#D4A574" strokeWidth="1" />
                    </g>

                    {/* Colosseum */}
                    <g transform="translate(650, 120)">
                        <ellipse cx="25" cy="70" rx="25" ry="15" fill="#A8A29E" opacity="0.7" />
                        <ellipse cx="25" cy="65" rx="22" ry="12" fill="#A8A29E" opacity="0.8" />
                        <ellipse cx="25" cy="60" rx="20" ry="10" fill="#A8A29E" opacity="0.9" />
                        <path d="M10 60 Q25 55 40 60" stroke="#78716C" strokeWidth="1" fill="none" />
                        <path d="M12 65 Q25 60 38 65" stroke="#78716C" strokeWidth="1" fill="none" />
                        <path d="M14 70 Q25 65 36 70" stroke="#78716C" strokeWidth="1" fill="none" />
                    </g>

                    {/* Pyramids */}
                    <g transform="translate(800, 130)">
                        <path d="M15 80 L35 80 L25 50 Z" fill="#D4A574" opacity="0.8" />
                        <path d="M35 80 L50 80 L42.5 55 Z" fill="#C19A6B" opacity="0.7" />
                        <path d="M25 50 L42.5 55 L25 45 Z" fill="#E8D5C4" opacity="0.6" />
                    </g>

                    {/* Great Wall of China segment */}
                    <g transform="translate(950, 140)">
                        <rect x="0" y="30" width="60" height="8" fill="#8B7D6B" opacity="0.7" />
                        <rect x="5" y="25" width="8" height="13" fill="#8B7D6B" opacity="0.8" />
                        <rect x="20" y="22" width="8" height="16" fill="#8B7D6B" opacity="0.8" />
                        <rect x="35" y="27" width="8" height="11" fill="#8B7D6B" opacity="0.8" />
                        <rect x="50" y="24" width="8" height="14" fill="#8B7D6B" opacity="0.8" />
                    </g>

                    {/* Sydney Opera House */}
                    <g transform="translate(1100, 125)">
                        <path d="M20 60 Q10 50 15 40 Q20 30 25 40 Q30 50 20 60" fill="#F3F4F6" opacity="0.8" />
                        <path d="M30 60 Q25 50 28 40 Q32 35 35 40 Q38 50 30 60" fill="#F3F4F6" opacity="0.7" />
                        <path d="M10 60 Q15 50 12 40 Q8 35 5 40 Q2 50 10 60" fill="#F3F4F6" opacity="0.7" />
                        <rect x="5" y="60" width="40" height="5" fill="#E5E7EB" opacity="0.8" />
                    </g>
                </svg>
            </div>

            {/* Subtle floating elements for depth */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-[#AEEEEE] rounded-full opacity-20 blur-3xl" />
            <div className="absolute top-40 right-20 w-40 h-40 bg-[#97E5E5] rounded-full opacity-15 blur-3xl" />
            <div className="absolute bottom-60 left-1/4 w-36 h-36 bg-[#AEEEEE] rounded-full opacity-10 blur-2xl" />
        </div>
    )
}
