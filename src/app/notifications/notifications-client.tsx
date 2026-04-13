"use client"

import { useState, useEffect } from "react"
import {
  Bell, CheckCheck, DollarSign, Heart, Users, Clock,
  AlertCircle, Trash2, Settings, Filter, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: string
  readAt: string | null
  createdAt: string
  data: any
  itinerary_id?: string
  itineraryId?: string
}

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Trip Status", value: "TRIP_STATUS" },
  { label: "Price Drops", value: "PRICE_DROP" },
  { label: "Recommendations", value: "RECOMMENDATION" },
  { label: "Social", value: "SOCIAL" },
  { label: "Reminders", value: "REMINDER" },
]

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  TRIP_STATUS: {
    icon: <CheckCheck className="h-5 w-5" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Trip Status",
  },
  PRICE_DROP: {
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Price Drop",
  },
  RECOMMENDATION: {
    icon: <Heart className="h-5 w-5" />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    label: "Recommendation",
  },
  SOCIAL: {
    icon: <Users className="h-5 w-5" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    label: "Social",
  },
  REMINDER: {
    icon: <Clock className="h-5 w-5" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Reminder",
  },
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchNotifications(0)
  }, [activeFilter, unreadOnly])

  const fetchNotifications = async (newOffset: number, refresh = false) => {
    if (newOffset === 0) {
      if (refresh) setIsRefreshing(true)
      else setIsLoading(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const params = new URLSearchParams({ limit: "20", offset: String(newOffset) })
      if (activeFilter) params.set("type", activeFilter)
      if (unreadOnly) params.set("unreadOnly", "true")

      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list: Notification[] = data.notifications ?? []

      setNotifications((prev) => (newOffset === 0 ? list : [...prev, ...list]))
      setHasMore(list.length === 20)
      setOffset(newOffset)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      setLoadingMore(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" })
      if (res.ok) {
        const now = new Date().toISOString()
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })))
        toast.success("All notifications marked as read")
      }
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotif = async (id: string) => {
    const removed = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Notification deleted")
    } catch {
      if (removed) setNotifications((prev) => [removed, ...prev])
      toast.error("Failed to delete")
    }
  }

  const handleClick = (n: Notification) => {
    if (!n.readAt) markAsRead(n.id)
    const itinId = n.itinerary_id ?? n.itineraryId
    if (n.data?.action === "view_itinerary" && itinId) {
      window.location.href = `/itinerary/${itinId}`
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchNotifications(0, true)}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-full"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs h-8">
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
          <Link href="/notifications/preferences">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setOffset(0) }}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                activeFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-all font-medium ml-auto",
            unreadOnly
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}
        >
          Unread only
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-5 animate-pulse">
                <div className="h-11 w-11 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                {unreadOnly || activeFilter
                  ? "No notifications match your current filters."
                  : "You'll see trip updates, price alerts, and recommendations here."}
              </p>
            </div>
            {(unreadOnly || activeFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setUnreadOnly(false); setActiveFilter("") }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {notifications.map((n, idx) => {
                const cfg = TYPE_CONFIG[n.type] ?? {
                  icon: <AlertCircle className="h-5 w-5" />,
                  color: "text-muted-foreground",
                  bg: "bg-muted",
                  label: "Notification",
                }
                const isUnread = !n.readAt

                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex gap-4 p-5 cursor-pointer hover:bg-accent/40 transition-colors group relative",
                      isUnread && "bg-primary/5"
                    )}
                  >
                    {/* Unread indicator */}
                    {isUnread && (
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className={cn("h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0", cfg.bg)}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", cfg.color)}>
                              {cfg.label}
                            </span>
                            {n.priority === "URGENT" && (
                              <span className="text-[10px] font-semibold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                                Urgent
                              </span>
                            )}
                            {n.priority === "HIGH" && (
                              <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded">
                                High
                              </span>
                            )}
                          </div>
                          <p className={cn("text-sm font-medium leading-tight", isUnread ? "text-foreground" : "text-muted-foreground")}>
                            {n.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(n.createdAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNotifications(offset + 20)}
                  disabled={loadingMore}
                  className="w-full max-w-xs"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
