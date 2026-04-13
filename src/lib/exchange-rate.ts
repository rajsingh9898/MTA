import { env } from "@/lib/env"

export type ExchangeRateResult = {
  from: string
  to: string
  rate: number
  amount: number
  convertedAmount: number
}

export async function convertCurrency(args: {
  from: string
  to: string
  amount?: number
}): Promise<ExchangeRateResult> {
  const key = env.EXCHANGERATE_API_KEY
  if (!key) {
    throw new Error("EXCHANGERATE_API_KEY is not set")
  }

  const from = args.from.toUpperCase()
  const to = args.to.toUpperCase()
  const amount = typeof args.amount === "number" ? args.amount : 1

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${key}/pair/${from}/${to}`,
    { next: { revalidate: 1800 } }
  )

  if (!response.ok) {
    throw new Error(`Exchange rate API failed (${response.status})`)
  }

  const data = (await response.json()) as {
    result?: string
    conversion_rate?: number
  }

  if (data.result !== "success" || typeof data.conversion_rate !== "number") {
    throw new Error("Exchange rate provider returned invalid data")
  }

  const rate = data.conversion_rate
  return {
    from,
    to,
    rate,
    amount,
    convertedAmount: Math.round(amount * rate * 100) / 100,
  }
}
