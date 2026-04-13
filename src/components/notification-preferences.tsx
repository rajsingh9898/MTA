"use client"

import { useState, useEffect } from "react"
import {
  Bell, Clock, Mail, Smartphone, CheckCheck,
  DollarSign, Heart, Users, ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface NotificationPreferences {
  tripStatusUpdates: boolean
  priceDropAlerts: boolean
  recommendations: boolean
  socialNotifications: boolean
  reminders: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-sm">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

interface ToggleRowProps {
  id: string
  icon?: React.ReactNode
  iconColor?: string
  iconBg?: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}

function ToggleRow({ id, icon, iconColor, iconBg, label, description, checked, onCheckedChange, disabled }: ToggleRowProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4", disabled && "opacity-50")}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
        <div>
          <Label htmlFor={id} className="font-medium text-sm cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    tripStatusUpdates: true,
    priceDropAlerts: true,
    recommendations: true,
    socialNotifications: true,
    reminders: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences")
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch {
      toast.error("Failed to load preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })
      if (response.ok) {
        toast.success("Preferences saved!")
        setHasChanges(false)
      } else {
        throw new Error()
      }
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  const update = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-border">
              <div className="h-3.5 bg-muted rounded w-1/4" />
            </div>
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-muted rounded w-28" />
                    <div className="h-2.5 bg-muted rounded w-44" />
                  </div>
                </div>
                <div className="h-5 w-9 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Notification Types */}
      <Section title="What to notify me about" description="Choose which types of notifications you want to receive">
        <ToggleRow
          id="trip-status"
          icon={<CheckCheck className="h-4 w-4" />}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          label="Trip Status Updates"
          description="Confirmations, changes, and booking updates"
          checked={preferences.tripStatusUpdates}
          onCheckedChange={(v) => update("tripStatusUpdates", v)}
        />
        <ToggleRow
          id="price-drop"
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          label="Price Drop Alerts"
          description="Get notified when prices drop for your saved trips"
          checked={preferences.priceDropAlerts}
          onCheckedChange={(v) => update("priceDropAlerts", v)}
        />
        <ToggleRow
          id="recommendations"
          icon={<Heart className="h-4 w-4" />}
          iconColor="text-pink-500"
          iconBg="bg-pink-500/10"
          label="Personalized Recommendations"
          description="Trip ideas based on your interests and past travel"
          checked={preferences.recommendations}
          onCheckedChange={(v) => update("recommendations", v)}
        />
        <ToggleRow
          id="social"
          icon={<Users className="h-4 w-4" />}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
          label="Social Notifications"
          description="Friend activities, shared trips, and connections"
          checked={preferences.socialNotifications}
          onCheckedChange={(v) => update("socialNotifications", v)}
        />
        <ToggleRow
          id="reminders"
          icon={<Bell className="h-4 w-4" />}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          label="Trip Reminders"
          description="Reminders 3 days and 1 day before your trip"
          checked={preferences.reminders}
          onCheckedChange={(v) => update("reminders", v)}
        />
      </Section>

      {/* Delivery Methods */}
      <Section title="How to notify me" description="Choose your preferred delivery methods">
        <ToggleRow
          id="email"
          icon={<Mail className="h-4 w-4" />}
          iconColor="text-foreground"
          iconBg="bg-muted"
          label="Email Notifications"
          description="Receive important updates in your inbox"
          checked={preferences.emailNotifications}
          onCheckedChange={(v) => update("emailNotifications", v)}
        />
        <ToggleRow
          id="push"
          icon={<Bell className="h-4 w-4" />}
          iconColor="text-foreground"
          iconBg="bg-muted"
          label="In-App Notifications"
          description="Real-time updates while using the app"
          checked={preferences.pushNotifications}
          onCheckedChange={(v) => update("pushNotifications", v)}
        />
        <ToggleRow
          id="sms"
          icon={<Smartphone className="h-4 w-4" />}
          iconColor="text-foreground"
          iconBg="bg-muted"
          label="SMS Notifications"
          description="Receive notifications via text message"
          checked={preferences.smsNotifications}
          onCheckedChange={(v) => update("smsNotifications", v)}
        />
      </Section>

      {/* Quiet Hours */}
      <Section title="Quiet Hours" description="Silence notifications during specific times">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="quiet-hours" className="font-medium text-sm cursor-pointer">
                  Enable Quiet Hours
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pause notifications between set times
                </p>
              </div>
            </div>
            <Switch
              id="quiet-hours"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(v) => update("quietHoursEnabled", v)}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-xs text-muted-foreground mb-1.5 block">
                  From
                </Label>
                <input
                  id="start-time"
                  type="time"
                  value={preferences.quietHoursStart ?? "22:00"}
                  onChange={(e) => update("quietHoursStart", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-xs text-muted-foreground mb-1.5 block">
                  Until
                </Label>
                <input
                  id="end-time"
                  type="time"
                  value={preferences.quietHoursEnd ?? "08:00"}
                  onChange={(e) => update("quietHoursEnd", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Save */}
      <Button
        onClick={savePreferences}
        disabled={isSaving || !hasChanges}
        className="w-full rounded-xl"
        size="lg"
      >
        {isSaving ? "Saving..." : hasChanges ? "Save Preferences" : "Preferences Saved"}
      </Button>
    </div>
  )
}
