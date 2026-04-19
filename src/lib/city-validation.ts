import { env } from "@/lib/env"

interface CityValidationResult {
  valid: boolean
  message?: string
}

export async function validateCity(city: string): Promise<CityValidationResult> {
  if (!city || city.trim().length < 2) {
    return { valid: false, message: "City name is too short" }
  }

  if (!/^[a-zA-Z\s\-']+$/.test(city)) {
    return { valid: false, message: "City must contain only letters, spaces, hyphens, and apostrophes" }
  }

  const apiKey = env.CITY_STATE_COUNTRY_API_KEY
  if (!apiKey) {
    console.warn("CITY_STATE_COUNTRY_API_KEY not set, skipping city validation")
    return { valid: true }
  }

  try {
    const cityName = city.trim()
    
    const response = await fetch(
      `https://api.countrystatecity.in/v1/cities/search?name=${encodeURIComponent(cityName)}`,
      {
        headers: {
          'X-CSCAPI-KEY': apiKey
        },
        cache: 'no-store' // Disable caching for real-time validation
      }
    )

    if (!response.ok) {
      console.error("City validation API error:", response.status, response.statusText)
      // If API fails, allow the city (fail-safe)
      return { valid: true }
    }

    const data = await response.json()
    console.log("City API response for", cityName, ":", data)
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("No cities found for:", cityName)
      // If API returns no results, allow the city (fail-safe)
      return { valid: true }
    }

    // Check if there's an exact match (case-insensitive)
    const exactMatch = data.some((cityData: any) => 
      cityData.name.toLowerCase() === cityName.toLowerCase()
    )

    if (exactMatch) {
      return { valid: true }
    }

    // If no exact match, check for partial matches
    if (data.length > 0) {
      // Allow partial matches with similar names
      const partialMatch = data.some((cityData: any) =>
        cityData.name.toLowerCase().includes(cityName.toLowerCase()) ||
        cityName.toLowerCase().includes(cityData.name.toLowerCase())
      )

      if (partialMatch) {
        return { valid: true }
      }
    }

    console.warn("No match found for city:", cityName, "Available cities:", data.map((d: any) => d.name))
    // If no match found, still allow the city (fail-safe)
    return { valid: true }
  } catch (error) {
    console.error("City validation error:", error)
    // On error, allow the city to proceed (fail-safe)
    return { valid: true }
  }
}

export async function validateCityWithSuggestions(city: string): Promise<{
  valid: boolean
  message?: string
  suggestions?: string[]
}> {
  const apiKey = env.CITY_STATE_COUNTRY_API_KEY
  if (!apiKey) {
    return { valid: true }
  }

  try {
    const cityName = city.trim()
    
    const response = await fetch(
      `https://api.countrystatecity.in/v1/cities/search?name=${encodeURIComponent(cityName)}&limit=5`,
      {
        headers: {
          'X-CSCAPI-KEY': apiKey
        }
      }
    )

    if (!response.ok) {
      return { valid: true }
    }

    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return { 
        valid: false, 
        message: "City not found. Please enter a valid city name",
        suggestions: []
      }
    }

    const exactMatch = data.some((cityData: any) => 
      cityData.name.toLowerCase() === cityName.toLowerCase()
    )

    if (exactMatch) {
      return { valid: true }
    }

    // Return suggestions
    const suggestions = data.slice(0, 5).map((cityData: any) => 
      `${cityData.name}, ${cityData.countryCode}`
    )

    return { 
      valid: false, 
      message: "City not found. Did you mean:",
      suggestions 
    }
  } catch (error) {
    console.error("City validation error:", error)
    return { valid: true }
  }
}
