const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

interface UnsplashPhoto {
    id: string
    urls: {
        raw: string
        full: string
        regular: string
        small: string
        thumb: string
    }
    alt_description: string | null
    user: {
        name: string
        username: string
    }
}

interface UnsplashSearchResponse {
    total: number
    total_pages: number
    results: UnsplashPhoto[]
}

const DEFAULT_TRAVEL_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"

/**
 * Fetch a destination image from Unsplash
 * Falls back to a default travel image if no API key or on error
 */
export async function getDestinationImage(destination: string): Promise<{
    url: string
    photographer?: string
    photographerUrl?: string
}> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn("UNSPLASH_ACCESS_KEY not set, using default image")
        return { url: DEFAULT_TRAVEL_IMAGE }
    }

    try {
        const query = encodeURIComponent(`${destination} travel landmark`)
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
                next: { revalidate: 86400 }, // Cache for 24 hours
            }
        )

        if (!response.ok) {
            console.error("Unsplash API error:", response.status)
            return { url: DEFAULT_TRAVEL_IMAGE }
        }

        const data: UnsplashSearchResponse = await response.json()

        if (data.results.length === 0) {
            console.warn(`No images found for "${destination}", using default`)
            return { url: DEFAULT_TRAVEL_IMAGE }
        }

        const photo = data.results[0]
        return {
            url: photo.urls.regular,
            photographer: photo.user.name,
            photographerUrl: `https://unsplash.com/@${photo.user.username}`,
        }
    } catch (error) {
        console.error("Error fetching Unsplash image:", error)
        return { url: DEFAULT_TRAVEL_IMAGE }
    }
}

/**
 * Get a smaller thumbnail version of a destination image
 */
export async function getDestinationThumbnail(destination: string): Promise<string> {
    if (!UNSPLASH_ACCESS_KEY) {
        return DEFAULT_TRAVEL_IMAGE
    }

    try {
        const query = encodeURIComponent(`${destination} travel`)
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                },
                next: { revalidate: 86400 },
            }
        )

        if (!response.ok) {
            return DEFAULT_TRAVEL_IMAGE
        }

        const data: UnsplashSearchResponse = await response.json()

        if (data.results.length === 0) {
            return DEFAULT_TRAVEL_IMAGE
        }

        return data.results[0].urls.small
    } catch (error) {
        return DEFAULT_TRAVEL_IMAGE
    }
}
