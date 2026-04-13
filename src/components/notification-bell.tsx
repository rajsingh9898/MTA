"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationPanel } from "@/components/notification-panel"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shake, setShake] = useState(false)
  const prevCount = useRef(0)

  useEffect(() => {
    fetchUnreadCount()

    // Set up SSE for real-time updates
    const eventSource = new EventSource("/api/notifications/stream")

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "count" || data.type === "update") {
          const newCount = data.count ?? 0
          if (newCount > prevCount.current) {
            setShake(true)
            setTimeout(() => setShake(false), 600)
          }
          prevCount.current = newCount
          setUnreadCount(newCount)
        }
      } catch {}
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count")
      if (response.ok) {
        const data = await response.json()
        const count = data.count ?? 0
        prevCount.current = count
        setUnreadCount(count)
      }
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false)
    }
  }

  const handleCountChange = (newCount: number) => {
    setUnreadCount(newCount)
    prevCount.current = newCount
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-full"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        id="notification-bell-btn"
      >
        <motion.div
          animate={shake ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Bell className="h-5 w-5" />
        </motion.div>

        <AnimatePresence>
          {!isLoading && unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <NotificationPanel
            onClose={() => setIsOpen(false)}
            onCountChange={handleCountChange}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
