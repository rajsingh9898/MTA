import OpenAI from "openai"
import { env } from "@/lib/env"
import { createLogger } from "@/lib/logger"

const logger = createLogger("openai")

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
})
export async function generateItineraryWithOpenAI(
    prompt: string,
    systemPrompt: string
) {
    if (!env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set")
    }
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        })
        return completion.choices[0].message.content
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown OpenAI API failure"
        logger.error("OpenAI API Error", message)
        throw new Error(`OpenAI API failed: ${message}`)
    }
}