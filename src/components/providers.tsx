"use client"

import { useRouter } from 'next/navigation'
import { HeroUIProvider } from "@heroui/react"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    return (
        <SessionProvider>
            <HeroUIProvider navigate={router.push}>
                {children}
            </HeroUIProvider>
        </SessionProvider>
    )
}
