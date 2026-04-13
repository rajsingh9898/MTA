"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plane,
    Train,
    PlaneLanding,
    PlaneTakeoff,
    RefreshCw,
    Loader2,
    TrendingUp,
    Wifi,
    WifiOff,
    ArrowRight,
    AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AirportInfo {
    code: string
    name: string
}

interface StationInfo {
    code: string
    name: string
}

interface CostData {
    flights: {
        available: boolean
        total: number
        perPerson: number
        live: boolean
        origin: string | null
        originAirport: AirportInfo | null
        destAirport: AirportInfo | null
        noFlightReason: string | null
        exactFare?: boolean
    }
    trains: {
        available: boolean
        total: number
        perPerson: number
        sleeper: number
        threeAC: number
        twoAC: number
        oneAC: number
        distanceKm: number
        live: boolean
        originStation: StationInfo | null
        destStation: StationInfo | null
        exactFare?: boolean
    }
    combinedRoute?: {
        available: boolean
        hubCity: string
        reason: string
        total: number
        totalPerPerson: number
        confidence: number
        exactFare?: boolean
        recommended: boolean
        segments: Array<{
            mode: "train" | "flight"
            from: string
            to: string
            total: number
            perPerson: number
            live: boolean
            confidence: number
            codeFrom: string | null
            codeTo: string | null
            exactFare?: boolean
        }>
    } | null
}

interface TripCostEstimatorProps {
    destination: string
    numDays: number
    partySize: number
    budget: string
    startDate?: string | Date | null
    endDate?: string | Date | null
    origin?: string
}

const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "NPR", "AED"] as const
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

function formatMoney(amount: number, currency: SupportedCurrency, conversionRate = 1) {
    const converted = amount * conversionRate
    const locale = currency === "INR" ? "en-IN" : "en-US"
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(converted)
}

export function TripCostEstimator({
    destination,
    numDays,
    partySize,
    budget,
    startDate,
    endDate,
    origin = "",
}: TripCostEstimatorProps) {
    const [costData, setCostData] = useState<CostData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currency, setCurrency] = useState<SupportedCurrency>("INR")
    const [exchangeRate, setExchangeRate] = useState(1)
    const [exchangeLoading, setExchangeLoading] = useState(false)
    const [exchangeError, setExchangeError] = useState<string | null>(null)
    const inFlightRef = useRef(false)
    const hasLoadedDataRef = useRef(false)
    const lastFetchAtRef = useRef(0)
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchCosts = useCallback(async (manual = false) => {
        if (inFlightRef.current) return
        if (manual && Date.now() - lastFetchAtRef.current < 1200) {
            toast.info("Please wait a moment before refreshing again.")
            return
        }

        inFlightRef.current = true
        if (hasLoadedDataRef.current) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                destination,
                numDays: String(numDays),
                partySize: String(partySize),
                budget,
                ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
                ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
                ...(origin ? { origin } : {}),
            })
            const res = await fetch(`/api/cost-estimate?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch cost estimate")
            const data: CostData = await res.json()
            setCostData(data)
            hasLoadedDataRef.current = true
            lastFetchAtRef.current = Date.now()
        } catch {
            setError("Could not load cost estimate.")
        } finally {
            setLoading(false)
            setRefreshing(false)
            inFlightRef.current = false
        }
    }, [destination, numDays, partySize, budget, startDate, endDate, origin])

    useEffect(() => {
        fetchCosts()
    }, [fetchCosts])

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        }
    }, [])

    function handleRefresh() {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = setTimeout(() => {
            fetchCosts(true)
        }, 300)
    }

    async function handleCurrencyChange(nextCurrency: SupportedCurrency) {
        setCurrency(nextCurrency)

        if (nextCurrency === "INR") {
            setExchangeRate(1)
            setExchangeError(null)
            return
        }

        setExchangeLoading(true)

        try {
            const response = await fetch(`/api/exchange-rate?from=INR&to=${nextCurrency}&amount=1`)
            if (!response.ok) {
                throw new Error("Failed to fetch exchange rate")
            }

            const data = (await response.json()) as {
                exchange?: { rate?: number }
            }

            const rate = data.exchange?.rate
            if (!rate || !Number.isFinite(rate)) {
                throw new Error("Invalid exchange rate")
            }

            setExchangeRate(rate)
            setExchangeError(null)
        } catch {
            setExchangeRate(1)
            setExchangeError(`Could not convert INR to ${nextCurrency}. Showing INR values.`)
            setCurrency("INR")
        } finally {
            setExchangeLoading(false)
        }
    }

    const hasFlight = Boolean(costData?.flights.available)
    const hasTrain = Boolean(costData?.trains.available)
    const hasAlternateRoute = Boolean(costData?.combinedRoute?.available)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
        >
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-semibold text-lg">Transport Fares</h2>
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                        Live
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={currency}
                        onChange={(e) => {
                            const next = e.target.value as SupportedCurrency
                            void handleCurrencyChange(next)
                        }}
                        disabled={exchangeLoading}
                        className="h-8 rounded-full border border-border bg-background px-3 text-xs font-medium"
                        aria-label="Select currency"
                    >
                        {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading} className="gap-2 rounded-full">
                        {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                    </Button>
                </div>
            </div>

            {(currency !== "INR" || exchangeError) && (
                <div className="px-6 py-2 text-[11px] text-muted-foreground border-b border-border/30 bg-muted/20">
                    {exchangeError
                        ? exchangeError
                        : exchangeLoading
                            ? `Fetching live INR to ${currency} rate...`
                            : `Converted from INR to ${currency} at ${exchangeRate.toFixed(4)}.`}
                </div>
            )}

            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-3 py-12 px-6">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Fetching live prices for <strong>{destination}</strong>...
                        </p>
                    </motion.div>
                )}

                {!loading && error && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-10 px-6">
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchCosts(true)} className="gap-2 rounded-full">
                            <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </Button>
                    </motion.div>
                )}

                {!loading && costData && (
                    <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="divide-y divide-border/40">
                            {hasFlight && (
                                <div className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mt-0.5">
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">Flight</span>
                                            {costData.flights.live ? (
                                                <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                                    <Wifi className="w-2.5 h-2.5" /> {costData.flights.exactFare ? "Exact Fare" : "Live Price"}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <WifiOff className="w-2.5 h-2.5" /> Estimated
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <PlaneTakeoff className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-xs font-mono font-bold text-blue-600">{costData.flights.originAirport?.code}</span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <PlaneLanding className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-xs font-mono font-bold text-blue-600">{costData.flights.destAirport?.code}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                            {costData.flights.originAirport?.name} → {costData.flights.destAirport?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatMoney(costData.flights.perPerson, currency, exchangeRate)}/person × {partySize} = {formatMoney(costData.flights.total, currency, exchangeRate)}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-sm whitespace-nowrap pt-1">
                                        {formatMoney(costData.flights.total, currency, exchangeRate)}
                                    </span>
                                </div>
                            )}

                            {hasTrain && (
                                <div className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mt-0.5">
                                        <Train className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">Train</span>
                                            {costData.trains.live ? (
                                                <span className="text-[10px] bg-green-100/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <Wifi className="w-2.5 h-2.5" /> {costData.trains.exactFare ? "Exact IRCTC Fare" : "Live IRCTC"}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                    <WifiOff className="w-2.5 h-2.5" /> IRCTC Estimate
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <span className="text-xs font-mono font-bold text-orange-600">{costData.trains.originStation?.code}</span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs font-mono font-bold text-orange-600">{costData.trains.destStation?.code}</span>
                                            {costData.trains.distanceKm > 0 && (
                                                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded ml-1">
                                                    ~{costData.trains.distanceKm} km
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                                            {costData.trains.originStation?.name} → {costData.trains.destStation?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatMoney(costData.trains.perPerson, currency, exchangeRate)}/person × {partySize} = {formatMoney(costData.trains.total, currency, exchangeRate)}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="text-[11px] font-semibold bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
                                                SL: {formatMoney(costData.trains.sleeper, currency, exchangeRate)}
                                            </span>
                                            <span className="text-[11px] font-semibold bg-gray-50 dark:bg-gray-900/20 px-2.5 py-1 rounded">
                                                3A: {formatMoney(costData.trains.threeAC, currency, exchangeRate)}
                                            </span>
                                            <span className="text-[11px] font-semibold bg-gray-50 dark:bg-gray-900/20 px-2.5 py-1 rounded">
                                                2A: {formatMoney(costData.trains.twoAC, currency, exchangeRate)}
                                            </span>
                                            {costData.trains.oneAC > 0 && (
                                                <span className="text-[11px] font-semibold bg-gray-50 dark:bg-gray-900/20 px-2.5 py-1 rounded">
                                                    1A: {formatMoney(costData.trains.oneAC, currency, exchangeRate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm whitespace-nowrap pt-1">
                                        {formatMoney(costData.trains.total, currency, exchangeRate)}
                                    </span>
                                </div>
                            )}

                            {hasAlternateRoute && (
                                <div className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors bg-indigo-50/40 dark:bg-indigo-950/20">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 mt-0.5">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">Alternate Route</span>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full font-semibold">
                                                Via {costData.combinedRoute?.hubCity.split(",")[0]}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {costData.combinedRoute?.reason}
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {costData.combinedRoute?.segments.map((seg, idx) => (
                                                <p key={`${seg.mode}-${idx}`} className="text-[11px] text-muted-foreground">
                                                    {idx + 1}. {seg.mode === "train" ? "Train" : "Flight"}: {seg.codeFrom || seg.from.split(",")[0]} to {seg.codeTo || seg.to.split(",")[0]} · {formatMoney(seg.perPerson, currency, exchangeRate)}/person{seg.exactFare ? " · exact" : " · estimated"}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm whitespace-nowrap pt-1">
                                        {formatMoney(costData.combinedRoute?.total || 0, currency, exchangeRate)}
                                    </span>
                                </div>
                            )}

                            {!hasFlight && !hasTrain && (
                                <div className="flex items-start gap-3 px-6 py-4 bg-amber-50/60 dark:bg-amber-900/10">
                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                        No flight or train fare is available for this route.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
