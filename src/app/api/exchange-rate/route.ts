import { NextResponse } from "next/server"
import { convertCurrency } from "@/lib/exchange-rate"

function sanitizeCurrency(code: string | null, fallback: string): string {
  if (!code) return fallback
  return code.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || fallback
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = sanitizeCurrency(searchParams.get("from"), "USD")
    const to = sanitizeCurrency(searchParams.get("to"), "INR")
    const amountRaw = Number(searchParams.get("amount") ?? "1")
    const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : 1

    const result = await convertCurrency({ from, to, amount })
    return NextResponse.json({ exchange: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch exchange rate"
    const status = message.includes("EXCHANGERATE_API_KEY") ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
