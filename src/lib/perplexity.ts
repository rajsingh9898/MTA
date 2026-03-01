interface PerplexityOptions {
    destination: string
    ageGroups: string[]
    activityLevel: string
    dietaryRestrictions?: string[]
    accessibilityNeeds?: string[]
    interests?: string[]
}

export async function searchPerplexity(query: string) {
    if (!process.env.PERPLEXITY_API_KEY) {
        throw new Error("PERPLEXITY_API_KEY is not set")
    }

    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "sonar",  // Updated to latest model
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful travel assistant. Provide current, accurate information about attractions, restaurants, and activities. Include hours, prices (in INR), accessibility info, and dietary options for restaurants where possible.",
                    },
                    {
                        role: "user",
                        content: query,
                    },
                ],
                max_tokens: 1500,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            if (response.status === 401 || response.status === 403) {
                console.error("Perplexity API Error: Unauthorized or Forbidden. Please check your API key.")
            } else {
                // Truncate errorText to avoid massive HTML dumps
                const cleanError = errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText;
                console.error("Perplexity API Error:", response.status, cleanError)
            }
            throw new Error(`Perplexity API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.choices[0].message.content
    } catch (error: any) {
        console.error("Perplexity API Error:", error.message)
        throw new Error(`Perplexity API failed: ${error.message}`)
    }
}

export function buildPerplexityQuery(options: PerplexityOptions): string {
    const { destination, ageGroups, activityLevel, dietaryRestrictions, accessibilityNeeds, interests } = options

    let query = `Find top attractions, restaurants, and activities in ${destination} suitable for ${ageGroups.join(", ")} with ${activityLevel} intensity.`

    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        query += ` Include restaurants with ${dietaryRestrictions.join(", ")} options.`
    }

    if (accessibilityNeeds && accessibilityNeeds.length > 0) {
        query += ` Focus on ${accessibilityNeeds.join(", ")} accessible venues.`
    }

    if (interests && interests.length > 0) {
        query += ` Prioritize activities related to: ${interests.join(", ")}.`
    }

    query += " Include current hours, prices in INR (₹), and accessibility info."

    return query
}

