"use client"

import { useState, useEffect, useRef } from "react"
import {
  X, Trash2, Clock, DollarSign, Users, Heart,
  AlertCircle, CheckCheck, Bell, ExternalLink, Settings,
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
  related_user_id?: string
  relatedUserId?: string
}

interface NotificationPanelProps {
  onClose: () => void
  onCountChange?: (count: number) => void
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  TRIP_STATUS: {
    icon: <CheckCheck className="h-4 w-4" />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  PRICE_DROP: {
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  RECOMMENDATION: {
    icon: <Heart className="h-4 w-4" />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  SOCIAL: {
    icon: <Users className="h-4 w-4" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  REMINDER: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
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
  return date.toLocaleDateString()
}

export function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications(0)

    // Close on outside click
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const bell = document.getElementById("notification-bell-btn")
        if (bell && bell.contains(e.target as Node)) return
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchNotifications = async (newOffset: number) => {
    try {
      const res = await fetch(`/api/notifications?limit=10&offset=${newOffset}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const list: Notification[] = data.notifications ?? []

      setNotifications((prev) => (newOffset === 0 ? list : [...prev, ...list]))
      setHasMore(list.length === 10)
      setOffset(newOffset)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      const unread = notifications.filter((n) => !n.readAt && n.id !== id).length
      onCountChange?.(unread)
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" })
      if (res.ok) {
        const now = new Date().toISOString()
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })))
        onCountChange?.(0)
        toast.success("All notifications marked as read")
      }
    } catch {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const n = notifications.find((x) => x.id === id)
    setNotifications((prev) => prev.filter((x) => x.id !== id))
    const newUnread = notifications.filter((x) => x.id !== id && !x.readAt).length
    onCountChange?.(newUnread)
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    } catch {
      // Rollback
      if (n) setNotifications((prev) => [n, ...prev])
      toast.error("Failed to delete")
    }
  }

  const handleClick = (n: Notification) => {
    if (!n.readAt) markAsRead(n.id)
    const itinId = n.itinerary_id ?? n.itineraryId
    if (n.data?.action === "view_itinerary" && itinId) {
      window.location.href = `/itinerary/${itinId}`
    }
    onClose()
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-12 w-[380px] max-w-[calc(100vw-24px)] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
      style={{ maxHeight: "min(600px, calc(100vh - 80px))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </Button>
          )}
          <Link href="/notifications" onClick={onClose}>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="All notifications">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You have no notifications right now.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? {
                  icon: <AlertCircle className="h-4 w-4" />,
                  color: "text-muted-foreground",
                  bg: "bg-muted",
                }
                const isUnread = !n.readAt

                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10, height: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors group relative",
                      isUnread && "bg-primary/5"
                    )}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                      <span className={cfg.color}>{cfg.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium leading-tight line-clamp-1", isUnread ? "text-foreground" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => deleteNotif(n.id, e)}
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {hasMore && (
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setLoadingMore(true); fetchNotifications(offset + 10) }}
                  disabled={loadingMore}
                  className="w-full text-xs text-muted-foreground"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-card">
        <Link href="/notifications" onClick={onClose} className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors group">
          <span>View all notifications & settings</span>
          <Settings className="h-3.5 w-3.5 group-hover:rotate-45 transition-transform duration-200" />
        </Link>
      </div>
    </motion.div>
  )
}
