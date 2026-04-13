import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import NotificationsClient from "./notifications-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notifications — MTA Planner",
  description: "View your trip updates, price alerts, recommendations, and social activity notifications.",
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-premium" />
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <NotificationsClient />
        </div>
      </div>
    </div>
  )
}
