import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/ui/navbar"
import { NotificationPreferences } from "@/components/notification-preferences"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Notification Settings — MTA Planner",
  description: "Manage your notification preferences: trip updates, price alerts, recommendations, and more.",
}

export default async function NotificationPreferencesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-premium" />
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Notification Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose what you want to be notified about and how.
              </p>
            </div>
            <NotificationPreferences />
          </div>
        </div>
      </div>
    </div>
  )
}
