import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"

const logger = createLogger("cost-estimate")

const DAY_MS = 24 * 60 * 60 * 1000
const ESTIMATE_CACHE_TTL_MS = DAY_MS

type CachedEstimate = {
    expiresAt: number
    payload: Record<string, unknown>
}

const globalForEstimateCache = globalThis as unknown as {
    __tripCostEstimateCache?: Map<string, CachedEstimate>
}

const estimateCache =
    globalForEstimateCache.__tripCostEstimateCache ??
    (globalForEstimateCache.__tripCostEstimateCache = new Map<string, CachedEstimate>())

// ── Hotel fallback by budget (INR/night) ─────────────────────────────────────
const HOTEL_FALLBACK: Record<string, number> = {
    Economy: 1500, Moderate: 4000, Luxury: 12000, "No Limit": 30000,
}

// ── Flight fallback by budget (INR/person round-trip) ────────────────────────
const FLIGHT_FALLBACK: Record<string, number> = {
    Economy: 6000, Moderate: 12000, Luxury: 30000, "No Limit": 80000,
}

const COUNTRY_GATEWAY_AIRPORTS: Record<string, Array<{ code: string; name: string }>> = {
    usa: [{ code: "JFK", name: "John F. Kennedy Int'l" }],
    "united states": [{ code: "JFK", name: "John F. Kennedy Int'l" }],
    uk: [{ code: "LHR", name: "Heathrow" }],
    "united kingdom": [{ code: "LHR", name: "Heathrow" }],
    canada: [{ code: "YYZ", name: "Toronto Pearson Int'l" }],
    germany: [{ code: "FRA", name: "Frankfurt" }],
    france: [{ code: "CDG", name: "Charles de Gaulle" }],
    australia: [{ code: "SYD", name: "Sydney" }],
    italy: [
        { code: "FCO", name: "Leonardo da Vinci (Rome Fiumicino)" },
        { code: "MXP", name: "Milan Malpensa" },
    ],
    spain: [{ code: "MAD", name: "Adolfo Suarez Madrid-Barajas" }],
    portugal: [{ code: "LIS", name: "Humberto Delgado" }],
    japan: [{ code: "NRT", name: "Narita Int'l" }],
    singapore: [{ code: "SIN", name: "Changi" }],
}

const HUB_CITIES = ["Delhi, India", "Mumbai, India", "Bengaluru, India", "Hyderabad, India", "Chennai, India"]
// ── Destination cost multiplier ───────────────────────────────────────────────
const DEST_MULTIPLIER: Record<string, number> = {
    oman: 2.2, muscat: 2.2, uae: 2.5, dubai: 2.5, qatar: 2.3, bahrain: 2.0,
    kuwait: 2.4, saudi: 2.3, france: 2.8, paris: 2.8, uk: 2.7, london: 3.0,
    italy: 2.5, rome: 2.5, germany: 2.6, spain: 2.3, switzerland: 3.5,
    usa: 3.0, "new york": 3.5, canada: 2.8, australia: 3.0,
    japan: 2.5, tokyo: 2.5, singapore: 2.8, korea: 2.2,
    thailand: 1.2, bali: 1.0, vietnam: 0.9, nepal: 0.8, india: 1.0,
}

function getMultiplier(destination: string): number {
    const lower = destination.toLowerCase()
    for (const [key, mult] of Object.entries(DEST_MULTIPLIER)) {
        if (lower.includes(key)) return mult
    }
    return 1.5
}

// ── IATA airport codes (ONLY cities that actually have commercial airports) ───
const CITY_IATA: Record<string, { code: string; name: string }> = {
    // India — with active commercial airports
    "mumbai": { code: "BOM", name: "Chhatrapati Shivaji Int'l" },
    "delhi": { code: "DEL", name: "Indira Gandhi Int'l" },
    "new delhi": { code: "DEL", name: "Indira Gandhi Int'l" },
    "bangalore": { code: "BLR", name: "Kempegowda Int'l" },
    "bengaluru": { code: "BLR", name: "Kempegowda Int'l" },
    "hyderabad": { code: "HYD", name: "Rajiv Gandhi Int'l" },
    "chennai": { code: "MAA", name: "Chennai Int'l" },
    "kolkata": { code: "CCU", name: "Netaji Subhas Chandra Bose Int'l" },
    "pune": { code: "PNQ", name: "Pune Airport" },
    "jaipur": { code: "JAI", name: "Jaipur Int'l" },
    "ahmedabad": { code: "AMD", name: "Sardar Vallabhbhai Patel Int'l" },
    "goa": { code: "GOI", name: "Goa Int'l (Dabolim)" },
    "kochi": { code: "COK", name: "Cochin Int'l" },
    "lucknow": { code: "LKO", name: "Chaudhary Charan Singh Int'l" },
    "amritsar": { code: "ATQ", name: "Sri Guru Ram Dass Jee Int'l" },
    "varanasi": { code: "VNS", name: "Lal Bahadur Shastri Int'l" },
    "nagpur": { code: "NAG", name: "Dr. Babasaheb Ambedkar Int'l" },
    "bhopal": { code: "BHO", name: "Raja Bhoj Airport" },
    "indore": { code: "IDR", name: "Devi Ahilyabai Holkar Airport" },
    "coimbatore": { code: "CJB", name: "Coimbatore Int'l" },
    "patna": { code: "PAT", name: "Jay Prakash Narayan Int'l" },
    "ranchi": { code: "IXR", name: "Birsa Munda Airport" },
    "srinagar": { code: "SXR", name: "Sheikh ul-Alam Int'l" },
    "chandigarh": { code: "IXC", name: "Chandigarh Int'l" },
    "visakhapatnam": { code: "VTZ", name: "Visakhapatnam Airport" },
    "trivandrum": { code: "TRV", name: "Trivandrum Int'l" },
    "mangalore": { code: "IXE", name: "Mangaluru Int'l" },
    "agra": { code: "AGR", name: "Agra Airport" },
    "jodhpur": { code: "JDH", name: "Jodhpur Airport" },
    "udaipur": { code: "UDR", name: "Maharana Pratap Airport" },
    "raipur": { code: "RPR", name: "Swami Vivekananda Airport" },
    "bhubaneswar": { code: "BBI", name: "Biju Patnaik Int'l" },
    "dehradun": { code: "DED", name: "Jolly Grant Airport" },
    "jammu": { code: "IXJ", name: "Jammu Airport" },
    "gorakhpur": { code: "GOP", name: "Gorakhpur Airport" },
    "allahabad": { code: "IXD", name: "Prayagraj Airport" },
    "prayagraj": { code: "IXD", name: "Prayagraj Airport" },
    "aurangabad": { code: "IXU", name: "Aurangabad Airport" },
    "hubli": { code: "HBX", name: "Hubli Airport" },
    "tiruchirapalli": { code: "TRZ", name: "Tiruchirappalli Int'l" },
    "madurai": { code: "IXM", name: "Madurai Airport" },
    // International
    "oman": { code: "MCT", name: "Muscat Int'l" },
    "muscat": { code: "MCT", name: "Muscat Int'l" },
    "dubai": { code: "DXB", name: "Dubai Int'l" },
    "uae": { code: "DXB", name: "Dubai Int'l" },
    "abu dhabi": { code: "AUH", name: "Abu Dhabi Int'l" },
    "doha": { code: "DOH", name: "Hamad Int'l" },
    "qatar": { code: "DOH", name: "Hamad Int'l" },
    "paris": { code: "CDG", name: "Charles de Gaulle" },
    "london": { code: "LHR", name: "Heathrow" },
    "new york": { code: "JFK", name: "John F. Kennedy Int'l" },
    "tokyo": { code: "NRT", name: "Narita Int'l" },
    "singapore": { code: "SIN", name: "Changi" },
    "bangkok": { code: "BKK", name: "Suvarnabhumi" },
    "bali": { code: "DPS", name: "Ngurah Rai Int'l" },
    "kathmandu": { code: "KTM", name: "Tribhuvan Int'l" },
    "rome": { code: "FCO", name: "Leonardo da Vinci" },
    "moscow": { code: "SVO", name: "Sheremetyevo Int'l" },
    "kuala lumpur": { code: "KUL", name: "Kuala Lumpur Int'l" },
    "malaysia": { code: "KUL", name: "Kuala Lumpur Int'l" },
    "colombo": { code: "CMB", name: "Bandaranaike Int'l" },
    "dhaka": { code: "DAC", name: "Hazrat Shahjalal Int'l" },
}

// Cities that explicitly have NO commercial airport (train-preferred)
const NO_AIRPORT_CITIES = [
    "bareilly", "aligarh", "mathura", "saharanpur", "moradabad", "meerut",
    "firozabad", "hapur", "muzaffarnagar", "ghaziabad", "noida", "faridabad",
    "kanpur nagar", "jhansi", "sitapur", "sultanpur", "azamgarh", "gonda",
    "bahraich", "hardoi", "fatehpur", "mirzapur", "sonbhadra", "ballia",
    "ambala", "panipat", "rohtak", "hisar", "bhiwani", "sirsa",
    "ajmer", "bikaner", "sikar", "alwar", "kota", "bharatpur",
    "jabalpur", "gwalior", "satna", "rewa",
    "bilaspur", "durg", "bhilai",
]

function hasNoAirport(city: string): boolean {
    const lower = city.toLowerCase()
    return NO_AIRPORT_CITIES.some((c) => lower.includes(c))
}

function getIATA(city: string): { code: string; name: string } | null {
    if (hasNoAirport(city)) return null
    const lower = city.toLowerCase()
    for (const [key, val] of Object.entries(CITY_IATA)) {
        if (lower.includes(key)) return val
    }
    const parts = city.trim().split(/[\s,]+/)
    for (const p of parts) {
        if (/^[A-Z]{3}$/.test(p)) return { code: p, name: p }
    }
    return null
}

function getAirportDetails(cityOrCountry: string): { code: string; name: string } | null {
    const direct = getIATA(cityOrCountry)
    if (direct) return direct
    const lower = cityOrCountry.toLowerCase()
    for (const [key, airports] of Object.entries(COUNTRY_GATEWAY_AIRPORTS)) {
        if (lower.includes(key)) return airports[0]
    }
    return null
}

function getDestinationAirportCandidates(destination: string): Array<{ code: string; name: string }> {
    const direct = getIATA(destination)
    if (direct) return [direct]

    const lower = destination.toLowerCase()
    for (const [key, airports] of Object.entries(COUNTRY_GATEWAY_AIRPORTS)) {
        if (lower.includes(key)) {
            return airports
        }
    }

    return []
}

// ── Indian railway stations ───────────────────────────────────────────────────
const CITY_STATION: Record<string, { code: string; name: string }> = {
    "mumbai": { code: "CSMT", name: "Chhatrapati Shivaji Maharaj Terminus" },
    "delhi": { code: "NDLS", name: "New Delhi Junction" },
    "new delhi": { code: "NDLS", name: "New Delhi Junction" },
    "bangalore": { code: "SBC", name: "KSR Bengaluru City" },
    "bengaluru": { code: "SBC", name: "KSR Bengaluru City" },
    "hyderabad": { code: "SC", name: "Secunderabad Junction" },
    "chennai": { code: "MAS", name: "Chennai Central" },
    "kolkata": { code: "HWH", name: "Howrah Junction" },
    "pune": { code: "PUNE", name: "Pune Junction" },
    "jaipur": { code: "JP", name: "Jaipur Junction" },
    "ahmedabad": { code: "ADI", name: "Ahmedabad Junction" },
    "goa": { code: "MAO", name: "Madgaon Junction" },
    "kochi": { code: "ERS", name: "Ernakulam Junction" },
    "lucknow": { code: "LKO", name: "Lucknow Charbagh" },
    "amritsar": { code: "ASR", name: "Amritsar Junction" },
    "varanasi": { code: "BSB", name: "Varanasi Junction" },
    "nagpur": { code: "NGP", name: "Nagpur Junction" },
    "bhopal": { code: "BPL", name: "Bhopal Junction" },
    "agra": { code: "AGC", name: "Agra Cantonment" },
    "chandigarh": { code: "CDG", name: "Chandigarh Junction" },
    "surat": { code: "ST", name: "Surat Junction" },
    "coimbatore": { code: "CBE", name: "Coimbatore Junction" },
    "patna": { code: "PNBE", name: "Patna Junction" },
    "indore": { code: "INDB", name: "Indore Junction" },
    "ayodhya": { code: "AY", name: "Ayodhya Junction" },
    "allahabad": { code: "ALD", name: "Prayagraj Junction" },
    "prayagraj": { code: "ALD", name: "Prayagraj Junction" },
    "gwalior": { code: "GWL", name: "Gwalior Junction" },
    "jabalpur": { code: "JBP", name: "Jabalpur Junction" },
    "raipur": { code: "R", name: "Raipur Junction" },
    "ranchi": { code: "RNC", name: "Ranchi Junction" },
    "dehradun": { code: "DDN", name: "Dehradun Junction" },
    "haridwar": { code: "HW", name: "Haridwar Junction" },
    "rishikesh": { code: "RKSH", name: "Rishikesh Junction" },
    "gorakhpur": { code: "GKP", name: "Gorakhpur Junction" },
    "bareilly": { code: "BE", name: "Bareilly Junction" },
    "meerut": { code: "MTC", name: "Meerut City Junction" },
    "aligarh": { code: "ALJN", name: "Aligarh Junction" },
    "mathura": { code: "MTJ", name: "Mathura Junction" },
    "kanpur": { code: "CNB", name: "Kanpur Central" },
    "moradabad": { code: "MB", name: "Moradabad Junction" },
    "saharanpur": { code: "SRE", name: "Saharanpur Junction" },
    "firozabad": { code: "FZD", name: "Firozabad Junction" },
    "jhansi": { code: "JHS", name: "Jhansi Junction" },
    "mirzapur": { code: "MZP", name: "Mirzapur Junction" },
    "azamgarh": { code: "AMH", name: "Azamgarh Junction" },
    "sultanpur": { code: "SLN", name: "Sultanpur Junction" },
    "ballia": { code: "BUI", name: "Ballia Junction" },
    "bhubaneswar": { code: "BBS", name: "Bhubaneswar Junction" },
    "visakhapatnam": { code: "VSKP", name: "Visakhapatnam Junction" },
    "madurai": { code: "MDU", name: "Madurai Junction" },
    "tiruchirapalli": { code: "TPJ", name: "Tiruchirappalli Junction" },
    "kathmandu": { code: "N/A", name: "No train service (Nepal)" },
}

function getStation(city: string): { code: string; name: string } | null {
    const lower = city.toLowerCase()
    for (const [key, val] of Object.entries(CITY_STATION)) {
        if (lower.includes(key)) return val
    }
    return null
}

function isInIndia(city: string): boolean {
    const lower = city.toLowerCase()
    if (lower.includes(", india") || lower.includes("india")) return true
    return Object.keys(CITY_STATION).some((k) => lower.includes(k)) &&
        !Object.keys(CITY_IATA).filter(k => !["india"].includes(k)).some(k =>
            ["oman", "uae", "dubai", "france", "uk", "usa", "japan", "singapore",
                "thailand", "bali", "nepal", "kathmandu", "moscow", "london", "paris",
                "rome", "malaysia", "qatar", "bahrain", "kuwait"].includes(k) &&
            lower.includes(k)
        )
}

function parsePrice(val: unknown): number {
    if (!val) return 0
    if (typeof val === "number") return val
    if (typeof val === "string") {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""))
        return isNaN(num) ? 0 : num
    }
    return 0
}

function normalizeDate(value: string | null): string {
    if (!value) return ""
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ""
    return parsed.toISOString().split("T")[0]
}

function cleanCity(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number): number {
    const parsed = Number.parseInt(value ?? "", 10)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

function buildEstimateCacheKey(input: {
    origin: string
    destination: string
    numDays: number
    partySize: number
    budget: string
    startDate: string
    endDate: string
}): string {
    return [
        cleanCity(input.origin),
        cleanCity(input.destination),
        input.numDays,
        input.partySize,
        input.budget.trim().toLowerCase(),
        input.startDate,
        input.endDate,
    ].join("|")
}

function clampConfidence(score: number): number {
    return Math.max(0.35, Math.min(0.98, Number(score.toFixed(2))))
}

function estimateLocalTransport(
    destination: string,
    budget: string,
    numDays: number,
    multiplier: number
): { perDayGroup: number; total: number; confidence: number; source: string; live: boolean } {
    const budgetBase: Record<string, number> = {
        Economy: 700,
        Moderate: 1500,
        Luxury: 3200,
        "No Limit": 5500,
    }
    const isDomestic = isInIndia(destination)
    const regionFactor = isDomestic ? 1 : 1.65
    const base = budgetBase[budget] || 1500
    const perDayGroup = Math.round(base * regionFactor * Math.max(1, multiplier * 0.65))
    const total = perDayGroup * numDays
    return {
        perDayGroup,
        total,
        confidence: clampConfidence(isDomestic ? 0.74 : 0.68),
        source: isDomestic ? "regional_model_india" : "regional_model_global",
        live: false,
    }
}

function estimateMeals(
    destination: string,
    budget: string,
    numDays: number,
    partySize: number,
    multiplier: number
): { perPersonPerDay: number; total: number; confidence: number; source: string; live: boolean } {
    const budgetBase: Record<string, number> = {
        Economy: 650,
        Moderate: 1200,
        Luxury: 2600,
        "No Limit": 4200,
    }
    const isDomestic = isInIndia(destination)
    const regionFactor = isDomestic ? 1 : 1.45
    const base = budgetBase[budget] || 1200
    const perPersonPerDay = Math.round(base * regionFactor * Math.max(0.9, multiplier * 0.55))
    const total = perPersonPerDay * partySize * numDays
    return {
        perPersonPerDay,
        total,
        confidence: clampConfidence(isDomestic ? 0.7 : 0.65),
        source: isDomestic ? "meal_model_india" : "meal_model_global",
        live: false,
    }
}

function estimateActivities(
    destination: string,
    budget: string,
    numDays: number,
    partySize: number,
    multiplier: number
): { perPersonPerDay: number; total: number; confidence: number; source: string; live: boolean } {
    const budgetBase: Record<string, number> = {
        Economy: 500,
        Moderate: 1100,
        Luxury: 2500,
        "No Limit": 4200,
    }
    const isDomestic = isInIndia(destination)
    const regionFactor = isDomestic ? 1 : 1.7
    const base = budgetBase[budget] || 1100
    const perPersonPerDay = Math.round(base * regionFactor * Math.max(0.95, multiplier * 0.6))
    const effectiveDays = Math.max(1, numDays - 1)
    const total = perPersonPerDay * partySize * effectiveDays
    return {
        perPersonPerDay,
        total,
        confidence: clampConfidence(isDomestic ? 0.66 : 0.6),
        source: isDomestic ? "activity_model_india" : "activity_model_global",
        live: false,
    }
}

// ── Real rail distances (km) between Indian cities ────────────────────────────
// Source: Indian Railways timetable / IRCTC distance data
const RAIL_DISTANCES: Record<string, number> = {
    // Bareilly routes
    "bareilly-delhi": 252, "bareilly-lucknow": 270, "bareilly-varanasi": 470,
    "bareilly-kanpur": 310, "bareilly-moradabad": 60, "bareilly-agra": 330,
    "bareilly-allahabad": 390, "bareilly-gorakhpur": 430,
    // Delhi routes
    "delhi-mumbai": 1384, "delhi-kolkata": 1455, "delhi-bengaluru": 2444,
    "delhi-chennai": 2175, "delhi-hyderabad": 1575, "delhi-jaipur": 308,
    "delhi-agra": 200, "delhi-lucknow": 512, "delhi-varanasi": 837,
    "delhi-amritsar": 449, "delhi-chandigarh": 250, "delhi-dehradun": 302,
    "delhi-haridwar": 314, "delhi-gorakhpur": 763, "delhi-allahabad": 633,
    "delhi-patna": 1001, "delhi-bhopal": 703, "delhi-indore": 900,
    "delhi-nagpur": 1094, "delhi-ahmedabad": 934, "delhi-pune": 1541,
    "delhi-goa": 1942, "delhi-kochi": 2900, "delhi-srinagar": 748,
    "delhi-jammu": 582, "delhi-jodhpur": 606, "delhi-udaipur": 736,
    "delhi-raipur": 1197, "delhi-ranchi": 1354, "delhi-bhubaneswar": 1751,
    // Mumbai routes
    "mumbai-pune": 192, "mumbai-goa": 584, "mumbai-bengaluru": 1157,
    "mumbai-hyderabad": 711, "mumbai-ahmedabad": 493, "mumbai-jaipur": 1104,
    "mumbai-nagpur": 835, "mumbai-bhopal": 757, "mumbai-kolkata": 1968,
    "mumbai-surat": 263, "mumbai-indore": 598, "mumbai-aurangabad": 338,
    // Lucknow routes
    "lucknow-varanasi": 320, "lucknow-allahabad": 204, "lucknow-gorakhpur": 270,
    "lucknow-kanpur": 80, "lucknow-agra": 361, "lucknow-patna": 514,
    "lucknow-kolkata": 1044, "lucknow-mumbai": 1485, "lucknow-hyderabad": 1571,
    // South India
    "chennai-bengaluru": 361, "chennai-hyderabad": 716, "chennai-kochi": 648,
    "chennai-madurai": 492, "chennai-tiruchirapalli": 334,
    "bengaluru-hyderabad": 574, "bengaluru-kochi": 602, "bengaluru-pune": 836,
    "bengaluru-madurai": 470, "hyderabad-pune": 581,
    // East India
    "kolkata-patna": 533, "kolkata-varanasi": 678, "kolkata-bhubaneswar": 440,
    "kolkata-hyderabad": 1665, "patna-varanasi": 251, "patna-gorakhpur": 261,
    // Others
    "varanasi-gorakhpur": 232, "varanasi-allahabad": 128, "allahabad-kanpur": 212,
    "jaipur-ahmedabad": 616, "jaipur-jodhpur": 320, "jaipur-udaipur": 431,
    "ahmedabad-surat": 256, "ahmedabad-indore": 430,
    "nagpur-bhopal": 356, "nagpur-raipur": 292,
    "bhubaneswar-visakhapatnam": 443,
}

function getRailDistance(origin: string, dest: string): number {
    const o = origin.toLowerCase().split(",")[0].trim()
    const d = dest.toLowerCase().split(",")[0].trim()
    return (
        RAIL_DISTANCES[`${o}-${d}`] ||
        RAIL_DISTANCES[`${d}-${o}`] ||
        0
    )
}

// ── Official Indian Railways 2AC fare slabs (INR, 2025) ──────────────────────
// Based on IR's published fare chart for AC 2-Tier (2A class)
function ir2ACFare(distanceKm: number): number {
    if (distanceKm <= 50) return 140
    if (distanceKm <= 100) return 200
    if (distanceKm <= 150) return 255
    if (distanceKm <= 200) return 315
    if (distanceKm <= 250) return 375
    if (distanceKm <= 300) return 430
    if (distanceKm <= 350) return 490
    if (distanceKm <= 400) return 545
    if (distanceKm <= 450) return 605
    if (distanceKm <= 500) return 665
    if (distanceKm <= 600) return 785
    if (distanceKm <= 700) return 900
    if (distanceKm <= 800) return 1015
    if (distanceKm <= 900) return 1130
    if (distanceKm <= 1000) return 1245
    if (distanceKm <= 1200) return 1460
    if (distanceKm <= 1400) return 1680
    if (distanceKm <= 1600) return 1895
    if (distanceKm <= 1800) return 2110
    if (distanceKm <= 2000) return 2320
    if (distanceKm <= 2500) return 2715
    return 3000
}

// Returns { sleeper, threeAC, twoAC, oneAC } per person (one-way)
function estimateTrainCost(origin: string, destination: string): {
    sleeper: number; threeAC: number; twoAC: number; oneAC: number; distanceKm: number; exactKnown: boolean
} {
    const o = origin.toLowerCase().split(",")[0].trim()
    const d = destination.toLowerCase().split(",")[0].trim()
    const routeKey = `${o}-${d}`
    const reverseKey = `${d}-${o}`

    const dist = getRailDistance(origin, destination)

    // Manual Exact Fares (includes Superfast/Reservation/GST charges)
    const exactFares: Record<string, { sleeper: number; threeAC: number; twoAC: number; oneAC: number }> = {
        "bareilly-varanasi": { sleeper: 325, threeAC: 890, twoAC: 1285, oneAC: 2095 },
    }

    if (exactFares[routeKey]) return { ...exactFares[routeKey], distanceKm: dist || 470, exactKnown: true }
    if (exactFares[reverseKey]) return { ...exactFares[reverseKey], distanceKm: dist || 470, exactKnown: true }

    if (dist === 0) {
        // Unknown route — rough fallback: 500km average
        return { sleeper: 325, threeAC: 890, twoAC: 1285, oneAC: 2095, distanceKm: 0, exactKnown: false }
    }

    // Official Base Slab (without GST/Dynamic/SF charges)
    const base2AC = ir2ACFare(dist)
    // Add estimated modifiers for realistic checkout price
    const superfastCharge = 45;
    const reservationCharge = 50;
    const gstRate = 1.05; // 5% GST on AC classes

    const final2AC = Math.round((base2AC + superfastCharge + reservationCharge) * gstRate)
    const final1AC = Math.round(final2AC * 1.63) // 1A is ~1.6x of 2A
    const final3AC = Math.round((base2AC * 0.69 + superfastCharge + reservationCharge) * gstRate)
    // Sleeper has no GST, lower SF charge
    const finalSL = Math.round(base2AC * 0.38) + 30 + 20

    return {
        sleeper: finalSL,
        threeAC: final3AC,
        twoAC: final2AC,
        oneAC: final1AC,
        distanceKm: dist,
        exactKnown: false,
    }
}

async function estimateFlightLeg(params: {
    apiKey?: string
    originAirport: { code: string; name: string }
    destAirport: { code: string; name: string }
    depDate: string
    retDate: string
    budget: string
    multiplier: number
}): Promise<{ perPerson: number; live: boolean }> {
    const { apiKey, originAirport, destAirport, depDate, retDate, budget, multiplier } = params
    let perPerson = 0
    let live = false

    try {
        if (apiKey) {
            const flightUrl =
                `https://serpapi.com/search.json?engine=google_flights` +
                `&departure_id=${originAirport.code}&arrival_id=${destAirport.code}` +
                `&outbound_date=${depDate}&return_date=${retDate}` +
                `&currency=INR&type=1&api_key=${apiKey}`
            const res = await fetch(flightUrl, { signal: AbortSignal.timeout(10000) })
            if (res.ok) {
                const data = await res.json()
                const allFlights = [...(data?.best_flights || []), ...(data?.other_flights || [])]
                const prices = allFlights
                    .map((f: { price?: unknown }) => parsePrice(f?.price))
                    .filter((p: number) => p > 0)
                if (prices.length > 0) {
                    perPerson = Math.min(...prices)
                    live = true
                }
            }
        }
    } catch (e) {
        logger.error("Flight leg fetch failed", e)
    }

    if (perPerson === 0) {
        perPerson = Math.round((FLIGHT_FALLBACK[budget] || 12000) * multiplier)
    }

    return { perPerson, live }
}

async function estimateBestFlightOption(params: {
    apiKey?: string
    originAirport: { code: string; name: string }
    destAirports: Array<{ code: string; name: string }>
    depDate: string
    retDate: string
    budget: string
    multiplier: number
}): Promise<{ airport: { code: string; name: string } | null; perPerson: number; live: boolean }> {
    const { apiKey, originAirport, destAirports, depDate, retDate, budget, multiplier } = params

    let bestAirport: { code: string; name: string } | null = null
    let bestPerPerson = Number.POSITIVE_INFINITY
    let bestLive = false

    for (const airport of destAirports.slice(0, 3)) {
        const estimate = await estimateFlightLeg({
            apiKey,
            originAirport,
            destAirport: airport,
            depDate,
            retDate,
            budget,
            multiplier,
        })

        const shouldReplace =
            estimate.perPerson < bestPerPerson ||
            (estimate.perPerson === bestPerPerson && estimate.live && !bestLive)

        if (shouldReplace) {
            bestAirport = airport
            bestPerPerson = estimate.perPerson
            bestLive = estimate.live
        }
    }

    if (!Number.isFinite(bestPerPerson)) {
        return { airport: null, perPerson: 0, live: false }
    }

    return { airport: bestAirport, perPerson: bestPerPerson, live: bestLive }
}

function selectBestHubForRoute(origin: string): string | null {
    const originCity = origin.toLowerCase().split(",")[0].trim()
    let bestHub: string | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (const hub of HUB_CITIES) {
        const hubCity = hub.toLowerCase().split(",")[0].trim()
        if (hubCity === originCity) continue
        const distance = getRailDistance(origin, hub)
        if (distance > 0 && distance < bestDistance) {
            bestDistance = distance
            bestHub = hub
        }
    }

    return bestHub || "Delhi, India"
}


export async function GET(request: Request) {
    const rateLimit = checkRateLimit(getRateLimitKey(request, "cost-estimate"), 20, 60_000)
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        )
    }

    const { searchParams } = new URL(request.url)
    const destination = searchParams.get("destination") || ""
    const numDays = parseBoundedInt(searchParams.get("numDays"), 1, 1, 30)
    const partySize = parseBoundedInt(searchParams.get("partySize"), 1, 1, 20)
    const budget = searchParams.get("budget") || "Moderate"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const origin = searchParams.get("origin") || ""

    if (!destination || destination.length > 120) {
        return NextResponse.json({ error: "Valid destination is required" }, { status: 400 })
    }

    const startDateNorm = normalizeDate(startDate)
    const endDateNorm = normalizeDate(endDate)
    const cacheKey = buildEstimateCacheKey({
        origin,
        destination,
        numDays,
        partySize,
        budget,
        startDate: startDateNorm,
        endDate: endDateNorm,
    })

    const existing = estimateCache.get(cacheKey)
    const now = Date.now()
    if (existing && existing.expiresAt > now) {
        const payload = {
            ...existing.payload,
            pricing: {
                ...(existing.payload.pricing || {}),
                cache: {
                    key: cacheKey,
                    hit: true,
                    ttlSeconds: Math.max(0, Math.floor((existing.expiresAt - now) / 1000)),
                },
            },
        }
        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=86400",
            },
        })
    }

    const apiKey = env.SERPAPI_KEY

    const multiplier = getMultiplier(destination)

    // ── 1. Live Hotel Price ──────────────────────────────────────────────────
    let hotelCostPerNight = 0
    let hotelLive = false
    let hotelName = ""

    try {
        const today = new Date()
        const checkIn = startDateNorm
            ? new Date(startDateNorm)
            : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        const checkOut = endDateNorm
            ? new Date(endDateNorm)
            : new Date(checkIn.getTime() + numDays * 24 * 60 * 60 * 1000)
        const fmt = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

        let hotelSearchQuery = `${destination} hotels`
        if (budget === "Economy") hotelSearchQuery = `cheap budget hotels in ${destination}`
        else if (budget === "Luxury" || budget === "No Limit") hotelSearchQuery = `5-star luxury hotels in ${destination}`
        else if (budget === "Moderate") hotelSearchQuery = `3-star 4-star hotels in ${destination}`

        const hotelUrl =
            `https://serpapi.com/search.json?engine=google_hotels` +
            `&q=${encodeURIComponent(hotelSearchQuery)}` +
            `&check_in_date=${fmt(checkIn)}&check_out_date=${fmt(checkOut)}` +
            `&currency=INR&adults=${partySize}&api_key=${apiKey}`

        if (apiKey) {
            const hotelRes = await fetch(hotelUrl, { signal: AbortSignal.timeout(8000) })
            if (hotelRes.ok) {
                const hotelData = await hotelRes.json()
                const properties = hotelData?.properties?.slice(0, 5) || []
                const prices: number[] = []
                for (const h of properties) {
                    const p =
                        parsePrice(h.rate_per_night?.extracted_lowest) ||
                        parsePrice(h.rate_per_night?.lowest) ||
                        parsePrice(h.price)
                    if (p > 0) { prices.push(p); if (!hotelName) hotelName = h.name || "" }
                }
                if (prices.length > 0) {
                    hotelCostPerNight = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
                    hotelLive = true
                }
            }
        }
    } catch (e) { logger.error("Hotel fetch failed", e) }

    if (hotelCostPerNight === 0) {
        hotelCostPerNight = Math.round((HOTEL_FALLBACK[budget] || 4000) * multiplier)
    }

    const today = new Date()
    const depDate = startDateNorm
        ? startDateNorm
        : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const retDate = endDateNorm
        ? endDateNorm
        : new Date(new Date(depDate).getTime() + numDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // ── 2. Flight Price (only if BOTH cities have airports) ──────────────────
    const originAirport = origin ? getAirportDetails(origin) : null
    const destinationAirportCandidates = getDestinationAirportCandidates(destination)
    const directDestinationCandidates = originAirport
        ? destinationAirportCandidates.filter((candidate) => candidate.code !== originAirport.code)
        : destinationAirportCandidates
    const flightsAvailable = originAirport !== null && directDestinationCandidates.length > 0

    let flightCostPerPerson = 0
    let flightLive = false
    let selectedFlightDestination: { code: string; name: string } | null = null

    if (flightsAvailable) {
        const directFlight = await estimateBestFlightOption({
            apiKey,
            originAirport: originAirport!,
            destAirports: directDestinationCandidates,
            depDate,
            retDate,
            budget,
            multiplier,
        })
        selectedFlightDestination = directFlight.airport
        flightCostPerPerson = directFlight.perPerson
        flightLive = directFlight.live
    }

    // ── 3. Train (India domestic only) ──────────────────────────────────────
    const originStation = origin ? getStation(origin) : null
    const destStation = getStation(destination)
    const trainAvailable =
        originStation !== null &&
        destStation !== null &&
        originStation.code !== "N/A" &&
        destStation.code !== "N/A"

    let trainEstimates = { sleeper: 0, threeAC: 0, twoAC: 0, oneAC: 0, distanceKm: 0, live: false, exactFare: false }

    if (trainAvailable) {
        let fetchedLive = false
        const rapidApiKey = process.env.RAPIDAPI_KEY

        if (rapidApiKey) {
            try {
                // Fetch live trains using RapidAPI's IRCTC endpoint
                const today = new Date()
                const depDateStr = startDateNorm
                    ? startDateNorm
                    : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

                const url = `https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations?fromStationCode=${originStation.code}&toStationCode=${destStation.code}&dateOfJourney=${depDateStr}`
                const res = await fetch(url, {
                    headers: {
                        'x-rapidapi-host': 'irctc1.p.rapidapi.com',
                        'x-rapidapi-key': rapidApiKey
                    },
                    signal: AbortSignal.timeout(6000)
                })

                if (res.ok) {
                    const data = await res.json()
                    const trains = data?.data || []
                    if (trains.length > 0) {
                        let bestTrain: {
                            sleeper: number
                            threeAC: number
                            twoAC: number
                            oneAC: number
                            distanceKm: number
                        } | null = null

                        for (const t of trains) {
                            const fare = t.train_base_fares
                            const twoAC = Number(fare?.["2A"] || 0)
                            if (twoAC > 0) {
                                const candidate = {
                                    sleeper: Number(fare?.["SL"] || 0),
                                    threeAC: Number(fare?.["3A"] || 0),
                                    twoAC,
                                    oneAC: Number(fare?.["1A"] || 0),
                                    distanceKm: Number(t.distance || 0),
                                }
                                if (!bestTrain || candidate.twoAC < bestTrain.twoAC) {
                                    bestTrain = candidate
                                }
                            }
                        }

                        if (bestTrain) {
                            trainEstimates = {
                                ...bestTrain,
                                live: true,
                                exactFare: true,
                            }
                            fetchedLive = true
                        }
                    }
                }
            } catch (e) {
                logger.error("RapidAPI Train fetch failed", e)
            }
        }

        // Fallback to official distance-based offline formula if live fetch fails or no key
        if (!fetchedLive || trainEstimates.twoAC === 0) {
            const estimated = estimateTrainCost(origin, destination)
            trainEstimates = { ...estimated, live: false, exactFare: estimated.exactKnown }
        }
    }

    const trainCostPerPerson = trainEstimates.twoAC
    const trainTotal = trainCostPerPerson * partySize

    let combinedRoute: {
        available: boolean
        hubCity: string
        reason: string
        total: number
        totalPerPerson: number
        confidence: number
        exactFare: boolean
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
            exactFare: boolean
        }>
    } | null = null

    const shouldTryCombined = Boolean(
        origin &&
        originStation &&
        destinationAirportCandidates.length > 0 &&
        isInIndia(origin) &&
        !isInIndia(destination)
    )

    if (shouldTryCombined) {
        const hubCity = selectBestHubForRoute(origin)
        const hubAirport = hubCity ? getAirportDetails(hubCity) : null
        const hubStation = hubCity ? getStation(hubCity) : null

        if (hubCity && hubAirport && hubStation) {
            const trainToHub = estimateTrainCost(origin, hubCity)
            const trainToHubPerPerson = trainToHub.twoAC

            if (trainToHubPerPerson > 0) {
                const hubDestinationCandidates = destinationAirportCandidates.filter(
                    (candidate) => candidate.code !== hubAirport.code
                )

                const flightFromHub = await estimateBestFlightOption({
                    apiKey,
                    originAirport: hubAirport,
                    destAirports: hubDestinationCandidates,
                    depDate,
                    retDate,
                    budget,
                    multiplier,
                })

                if (flightFromHub.airport) {
                    const destinationAirport = flightFromHub.airport

                    const combinedPerPerson = trainToHubPerPerson + flightFromHub.perPerson
                    const combinedTotal = combinedPerPerson * partySize
                    const hubCityName = hubCity.split(",")[0]
                    const destinationLabel = `${destinationAirport.name} (${destinationAirport.code})`
                    combinedRoute = {
                        available: true,
                        hubCity,
                        reason: `No direct airport route from ${origin.split(",")[0]} to ${destination}. Take train to ${hubCityName}, then fly from ${hubAirport.name} (${hubAirport.code}) to ${destinationLabel}.`,
                        total: combinedTotal,
                        totalPerPerson: combinedPerPerson,
                        confidence: clampConfidence(Math.min(0.78, flightFromHub.live ? 0.9 : 0.7)),
                        exactFare: flightFromHub.live,
                        recommended: !flightLive || combinedTotal < Math.max(1, flightCostPerPerson * partySize),
                        segments: [
                            {
                                mode: "train",
                                from: origin,
                                to: hubCity,
                                total: trainToHubPerPerson * partySize,
                                perPerson: trainToHubPerPerson,
                                live: false,
                                confidence: 0.78,
                                codeFrom: originStation?.code || null,
                                codeTo: hubStation.code || null,
                                exactFare: false,
                            },
                            {
                                mode: "flight",
                                from: hubCity,
                                to: destinationLabel,
                                total: flightFromHub.perPerson * partySize,
                                perPerson: flightFromHub.perPerson,
                                live: flightFromHub.live,
                                confidence: flightFromHub.live ? 0.9 : 0.7,
                                codeFrom: hubAirport.code,
                                codeTo: destinationAirport.code,
                                exactFare: flightFromHub.live,
                            },
                        ],
                    }
                }
            }
        }
    }

    const localTransport = estimateLocalTransport(destination, budget, numDays, multiplier)
    const meals = estimateMeals(destination, budget, numDays, partySize, multiplier)
    const activities = estimateActivities(destination, budget, numDays, partySize, multiplier)

    // ── 4. Totals ─────────────────────────────────────────────────────────────
    const hotelTotal = hotelCostPerNight * numDays
    const flightTotal = flightsAvailable ? flightCostPerPerson * partySize : 0
    const transportOptions = [
        ...(flightTotal > 0 ? [{ type: "direct_flight", total: flightTotal, perPerson: flightCostPerPerson, exactFare: flightLive }] : []),
        ...(trainTotal > 0 ? [{ type: "direct_train", total: trainTotal, perPerson: trainCostPerPerson, exactFare: trainEstimates.exactFare }] : []),
        ...(combinedRoute?.available ? [{ type: "via_hub_combined", total: combinedRoute.total, perPerson: combinedRoute.totalPerPerson, exactFare: combinedRoute.exactFare }] : []),
    ]
    const selectedTransportOption = transportOptions.length > 0
        ? [...transportOptions].sort((a, b) => {
            if (a.exactFare !== b.exactFare) return a.exactFare ? -1 : 1
            return a.total - b.total
        })[0]
        : null
    const transportTotal = selectedTransportOption?.total || 0
    const grandTotal =
        hotelTotal +
        transportTotal +
        localTransport.total +
        meals.total +
        activities.total
    const perPerson = Math.round(grandTotal / partySize)

    const weightedConfidenceNumerator =
        hotelTotal * (hotelLive ? 0.9 : 0.72) +
        transportTotal * (
            flightTotal > 0
                ? (flightLive ? 0.9 : 0.7)
                : (trainEstimates.live ? 0.88 : 0.78)
        ) +
        localTransport.total * localTransport.confidence +
        meals.total * meals.confidence +
        activities.total * activities.confidence
    const confidenceOverall = clampConfidence(weightedConfidenceNumerator / Math.max(grandTotal, 1))

    // Compute why no flights (for UI message)
    const noFlightReason = !origin
        ? "no_origin"
        : hasNoAirport(origin)
            ? `no_airport_origin`
            : destinationAirportCandidates.length === 0 || hasNoAirport(destination)
                ? `no_airport_dest`
                : !originAirport
                    ? `no_airport_origin`
                : !selectedFlightDestination
                        ? `no_airport_dest`
                        : null

    const payload = {
        hotels: {
            total: hotelTotal,
            perNight: hotelCostPerNight,
            live: hotelLive,
            topHotel: hotelName,
            confidence: hotelLive ? 0.9 : 0.72,
            source: hotelLive ? "google_hotels_live" : "budget_fallback_model",
        },
        flights: {
            available: flightsAvailable,
            total: flightTotal,
            perPerson: flightCostPerPerson,
            live: flightLive,
            origin: origin || null,
            originAirport: originAirport || null,
            destAirport: selectedFlightDestination || destinationAirportCandidates[0] || null,
            noFlightReason,
            exactFare: flightLive,
            confidence: flightsAvailable ? (flightLive ? 0.9 : 0.7) : 0,
            source: flightsAvailable ? (flightLive ? "google_flights_live" : "flight_fallback_model") : "not_applicable",
        },
        trains: {
            available: trainAvailable,
            total: trainTotal,
            perPerson: trainCostPerPerson,
            sleeper: trainEstimates.sleeper,
            threeAC: trainEstimates.threeAC,
            twoAC: trainEstimates.twoAC,
            oneAC: trainEstimates.oneAC,
            distanceKm: trainEstimates.distanceKm,
            live: trainEstimates.live,
            exactFare: trainEstimates.exactFare,
            originStation: originStation || null,
            destStation: destStation || null,
            confidence: trainAvailable ? (trainEstimates.live ? 0.88 : 0.78) : 0,
            source: trainAvailable ? (trainEstimates.live ? "irctc_live" : "distance_slab_model") : "not_applicable",
        },
        combinedRoute,
        transportOptions,
        localTransport,
        meals,
        activities,
        grandTotal,
        perPerson,
        numDays,
        partySize,
        budget,
        pricing: {
            currency: "INR",
            generatedAt: new Date().toISOString(),
            confidenceOverall,
            selectedTransport: selectedTransportOption?.type || "none",
            cache: {
                key: cacheKey,
                hit: false,
                ttlSeconds: Math.floor(ESTIMATE_CACHE_TTL_MS / 1000),
            },
        },
    }

    estimateCache.set(cacheKey, {
        expiresAt: Date.now() + ESTIMATE_CACHE_TTL_MS,
        payload,
    })

    return NextResponse.json(payload, {
        headers: {
            "Cache-Control": "public, max-age=300, s-maxage=86400",
        },
    })
}
