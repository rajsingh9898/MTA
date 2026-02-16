import OpenAI from "openai"
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})
export async function generateItineraryWithOpenAI(
    prompt: string,
    systemPrompt: string
) {
    if (!process.env.OPENAI_API_KEY) {
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
    } catch (error: any) {
        console.error("OpenAI API Error:", error.message)
        throw new Error(`OpenAI API failed: ${error.message}`)
    }
}