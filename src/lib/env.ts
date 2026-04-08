import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  PERPLEXITY_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),
  SERPAPI_KEY: z.string().min(1).optional(),
  RAPIDAPI_KEY: z.string().min(1).optional(),
})

const env = envSchema.parse(process.env)

if (env.NODE_ENV === "production") {
  const requiredKeys: Array<keyof typeof env> = [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
  ]

  const missingKeys = requiredKeys.filter((key) => !env[key])

  if (missingKeys.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingKeys.join(", ")}`)
  }
}

export { env }
export const isProduction = env.NODE_ENV === "production"