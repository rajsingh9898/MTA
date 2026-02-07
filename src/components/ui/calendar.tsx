"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ReactCalendar from "react-calendar"

import { cn } from "@/lib/utils"
import "react-calendar/dist/Calendar.css"

type Value = Date | null

export interface CalendarProps {
    mode?: "single" | "range"
    selected?: Date | { from?: Date; to?: Date } | null
    onSelect?: (value: Date | { from?: Date; to?: Date } | null) => void
    disabled?: (date: Date) => boolean
    className?: string
    defaultMonth?: Date
}

function Calendar({
    mode = "single",
    selected,
    onSelect,
    disabled,
    className,
    defaultMonth,
}: CalendarProps) {

    // ✅ lock past dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const handleChange = (date: Date) => {
        if (!onSelect) return

        if (mode === "single") {
            onSelect(date)
            return
        }

        if (mode === "range") {
            const range = selected as { from?: Date; to?: Date } | null

            // First click OR restart
            if (!range?.from || (range.from && range.to)) {
                onSelect({ from: date, to: undefined })
                return
            }

            // Second click → end date
            if (range.from && !range.to) {
                let from = range.from
                let to = date

                if (to < from) {
                    ;[from, to] = [to, from]
                }

                // ✅ calculate days
                const diffTime = Math.abs(
                    to.getTime() - from.getTime()
                )
                const days =
                    Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

                console.log("Selected days:", days)

                onSelect({ from, to })
            }
        }
    }

    const getValue = (): Value => {
        if (mode === "single") {
            return selected as Date
        }

        if (mode === "range") {
            const range = selected as { from?: Date; to?: Date } | null
            return range?.to || range?.from || null
        }

        return null
    }

    // ✅ disable past days
    const tileDisabled = ({ date }: { date: Date }) => {
        if (date < today) return true
        return disabled ? disabled(date) : false
    }

    // ✅ inject styles
    React.useEffect(() => {
        const style = document.createElement("style")
        style.textContent = `
            .react-calendar {
                width: 100%;
                border: none !important;
                font-family: inherit;
            }

            .react-calendar__navigation {
                display: flex;
                margin-bottom: 1rem;
                justify-content: space-between;
            }

            .react-calendar__navigation button {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.375rem;
            }

            .react-calendar__navigation button:hover {
                background-color: hsl(var(--secondary));
            }

            /* ✅ remove ".." underline */
            .react-calendar__month-view__weekdays__weekday abbr {
                text-decoration: none !important;
                border: none !important;
            }

            .react-calendar__tile {
                border-radius: 0.5rem;
                padding: 0.5rem;
                background: transparent;
                transition: 0.2s;
            }

            .react-calendar__tile:hover {
                background-color: hsl(var(--secondary));
            }

            /* ✅ past days look softer but visible */
            .react-calendar__tile:disabled {
                opacity: 0.35;
                background: transparent !important;
                color: inherit !important;
                cursor: not-allowed;
            }

            .react-calendar__month-view__days__day--neighboringMonth {
                opacity: 0.4;
            }

            .react-calendar__tile--active {
                background-color: hsl(var(--primary)) !important;
                color: hsl(var(--primary-foreground)) !important;
            }

            .react-calendar__tile--now {
                background-color: hsl(var(--accent));
                font-weight: 600;
            }
        `
        document.head.appendChild(style)
        return () => {
            document.head.removeChild(style)
        }
    }, [])

    return (
        <div className={cn("calendar-wrapper", className)}>
            <ReactCalendar
                onChange={handleChange as any}
                value={getValue()}
                selectRange={false}
                tileDisabled={tileDisabled}
                defaultActiveStartDate={defaultMonth}
                locale="en-US"
                nextLabel={<ChevronRight className="h-4 w-4" />}
                prevLabel={<ChevronLeft className="h-4 w-4" />}
                next2Label={null}
                prev2Label={null}
                className="!border-none !bg-transparent"
            />
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }