"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
    MapPin,
    Calendar as CalendarIcon,
    Wallet,
    Users,
    Activity,
    Heart,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Minus,
    Plus,
    Mountain,
    Home,
    Loader2,
    LocateFixed
} from "lucide-react"

import { itinerarySchema, ItineraryInput, DIETARY_OPTIONS, ACCESSIBILITY_OPTIONS, INTEREST_OPTIONS } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
// import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { differenceInDays, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { ClimatePreview } from "@/components/climate-preview"

const STEPS = [
    { id: 1, title: "Origin", description: "Where are you traveling from?", icon: LocateFixed },
    { id: 2, title: "Destination", description: "Where would you like to go?", icon: MapPin },
    { id: 3, title: "Duration", description: "How long is your trip?", icon: CalendarIcon },
    { id: 4, title: "Budget", description: "What's your budget preference?", icon: Wallet },
    { id: 5, title: "Travelers", description: "Who's coming along?", icon: Users },
    { id: 6, title: "Pace", description: "How active do you want to be?", icon: Activity },
    { id: 7, title: "Preferences", description: "Any special requirements?", icon: Heart },
]

const TRAVELER_TYPES = [
    { id: "Adults", label: "Adults", description: "18-64 years" },
    { id: "Children", label: "Children", description: "3-12 years" },
    { id: "Teens", label: "Teens", description: "13-17 years" },
    { id: "Seniors", label: "Seniors", description: "65+ years" },
] as const

const BUDGET_OPTIONS = [
    { value: "Economy", label: "Economy", description: "Hostels, street food, public transport" },
    { value: "Moderate", label: "Moderate", description: "Mid-range hotels, local restaurants" },
    { value: "Luxury", label: "Luxury", description: "Premium hotels, fine dining" },
    { value: "No Limit", label: "No Limit", description: "The best of everything" },
] as const

const PACE_OPTIONS = [
    { value: "Relaxed", label: "Relaxed", description: "Take it slow, plenty of rest" },
    { value: "Moderate", label: "Moderate", description: "Balanced mix of activities" },
    { value: "Active", label: "Active", description: "Packed schedule, lots to see" },
    { value: "Very Active", label: "Very Active", description: "Non-stop exploration" },
]

const LOADING_MESSAGES = [
    "Finding best experiences...",
    "Discovering hidden gems...",
    "Planning your routes...",
    "Checking local favorites...",
    "Crafting your perfect itinerary...",
]

// Comprehensive world cities database for suggestions
const CITY_DATABASE = [
    // India
    "Mumbai, India", "Delhi, India", "Bangalore, India", "Hyderabad, India", 
    "Chennai, India", "Kolkata, India", "Pune, India", "Jaipur, India",
    "Ahmedabad, India", "Surat, India", "Lucknow, India", "Kanpur, India",
    "Nagpur, India", "Indore, India", "Thane, India", "Bhopal, India",
    "Visakhapatnam, India", "Goa, India", "Chandigarh, India", "Kochi, India",
    "Coimbatore, India", "Kozhikode, India", "Trivandrum, India", "Agra, India",
    "Varanasi, India", "Amritsar, India", "Jodhpur, India", "Udaipur, India",
    "Jaisalmer, India", "Pushkar, India", "Rishikesh, India", "Haridwar, India",
    "Shimla, India", "Manali, India", "Dharamshala, India", "Leh, India",
    "Srinagar, India", "Gulmarg, India", "Pahalgam, India", "Sonamarg, India",
    
    // USA
    "New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA",
    "Phoenix, USA", "Philadelphia, USA", "San Antonio, USA", "San Diego, USA",
    "Dallas, USA", "San Jose, USA", "Austin, USA", "Jacksonville, USA",
    "Fort Worth, USA", "Columbus, USA", "Charlotte, USA", "San Francisco, USA",
    "Indianapolis, USA", "Seattle, USA", "Denver, USA", "Washington, USA",
    "Boston, USA", "Miami, USA", "Atlanta, USA", "Orlando, USA",
    "Las Vegas, USA", "Nashville, USA", "Tampa, USA", "Portland, USA",
    "San Antonio, USA", "San Diego, USA", "Sacramento, USA", "Baltimore, USA",
    "Milwaukee, USA", "Kansas City, USA", "Tucson, USA", "Fresno, USA",
    "Mesa, USA", "Omaha, USA", "Colorado Springs, USA", "Raleigh, USA",
    "Virginia Beach, USA", "Long Beach, USA", "Oakland, USA", "Tulsa, USA",
    "Minneapolis, USA", "Cleveland, USA", "Wichita, USA", "Arlington, USA",
    "New Orleans, USA", "Honolulu, USA", "Anchorage, USA", "Albuquerque, USA",
    
    // UK
    "London, UK", "Manchester, UK", "Birmingham, UK", "Leeds, UK",
    "Glasgow, UK", "Liverpool, UK", "Sheffield, UK", "Bristol, UK",
    "Edinburgh, UK", "Cardiff, UK", "Coventry, UK", "Nottingham, UK",
    "Leicester, UK", "Bradford, UK", "Belfast, UK", "Newcastle, UK",
    
    // France
    "Paris, France", "Marseille, France", "Lyon, France", "Toulouse, France",
    "Nice, France", "Nantes, France", "Strasbourg, France", "Bordeaux, France",
    "Lille, France", "Montpellier, France", "Rennes, France", "Reims, France",
    
    // Germany
    "Berlin, Germany", "Munich, Germany", "Frankfurt, Germany", "Hamburg, Germany",
    "Cologne, Germany", "Stuttgart, Germany", "Düsseldorf, Germany", "Dortmund, Germany",
    "Leipzig, Germany", "Dresden, Germany", "Hannover, Germany", "Nuremberg, Germany",
    "Bremen, Germany", "Essen, Germany", "Duisburg, Germany", "Bochum, Germany",
    
    // Italy
    "Rome, Italy", "Milan, Italy", "Naples, Italy", "Turin, Italy",
    "Florence, Italy", "Venice, Italy", "Bologna, Italy", "Genoa, Italy",
    "Palermo, Italy", "Verona, Italy", "Bari, Italy", "Catania, Italy",
    "Siena, Italy", "Pisa, Italy", "Trieste, Italy", "Perugia, Italy",
    
    // Spain
    "Madrid, Spain", "Barcelona, Spain", "Valencia, Spain", "Seville, Spain",
    "Bilbao, Spain", "Malaga, Spain", "Murcia, Spain", "Palma, Spain",
    "Las Palmas, Spain", "Zaragoza, Spain", "Valladolid, Spain", "Cordoba, Spain",
    
    // Netherlands
    "Amsterdam, Netherlands", "Rotterdam, Netherlands", "The Hague, Netherlands",
    "Utrecht, Netherlands", "Eindhoven, Netherlands", "Groningen, Netherlands",
    "Tilburg, Netherlands", "Almere, Netherlands", "Breda, Netherlands",
    
    // Belgium
    "Brussels, Belgium", "Antwerp, Belgium", "Ghent, Belgium", "Bruges, Belgium",
    "Liege, Belgium", "Namur, Belgium", "Leuven, Belgium", "Mechelen, Belgium",
    
    // Switzerland
    "Zurich, Switzerland", "Geneva, Switzerland", "Basel, Switzerland", "Bern, Switzerland",
    "Lausanne, Switzerland", "Winterthur, Switzerland", "Lucerne, Switzerland",
    
    // Austria
    "Vienna, Austria", "Salzburg, Austria", "Innsbruck, Austria", "Graz, Austria",
    "Linz, Austria", "Klagenfurt, Austria", "Villach, Austria", "Bregenz, Austria",
    
    // Scandinavia
    "Stockholm, Sweden", "Gothenburg, Sweden", "Malmö, Sweden",
    "Oslo, Norway", "Bergen, Norway", "Trondheim, Norway", "Stavanger, Norway",
    "Copenhagen, Denmark", "Aarhus, Denmark", "Odense, Denmark",
    "Helsinki, Finland", "Espoo, Finland", "Tampere, Finland", "Turku, Finland",
    
    // Eastern Europe
    "Warsaw, Poland", "Krakow, Poland", "Łódź, Poland", "Wrocław, Poland",
    "Prague, Czech Republic", "Brno, Czech Republic", "Ostrava, Czech Republic",
    "Budapest, Hungary", "Debrecen, Hungary", "Szeged, Hungary",
    "Bucharest, Romania", "Cluj-Napoca, Romania", "Timișoara, Romania",
    "Sofia, Bulgaria", "Plovdiv, Bulgaria", "Varna, Bulgaria", "Burgas, Bulgaria",
    "Belgrade, Serbia", "Novi Sad, Serbia", "Niš, Serbia", "Kragujevac, Serbia",
    "Zagreb, Croatia", "Split, Croatia", "Rijeka, Croatia", "Dubrovnik, Croatia",
    "Ljubljana, Slovenia", "Maribor, Slovenia", "Celje, Slovenia",
    "Sarajevo, Bosnia", "Banja Luka, Bosnia", "Mostar, Bosnia", "Tuzla, Bosnia",
    "Athens, Greece", "Thessaloniki, Greece", "Patras, Greece", "Heraklion, Greece",
    "Istanbul, Turkey", "Ankara, Turkey", "Izmir, Turkey", "Bursa, Turkey",
    "Antalya, Turkey", "Konya, Turkey", "Adana, Turkey", "Gaziantep, Turkey",
    
    // Russia
    "Moscow, Russia", "Saint Petersburg, Russia", "Novosibirsk, Russia",
    "Yekaterinburg, Russia", "Nizhny Novgorod, Russia", "Kazan, Russia",
    "Samara, Russia", "Omsk, Russia", "Chelyabinsk, Russia", "Rostov-on-Don, Russia",
    "Ufa, Russia", "Perm, Russia", "Volgograd, Russia", "Krasnoyarsk, Russia",
    
    // Middle East
    "Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE", "Al Ain, UAE",
    "Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia", "Mecca, Saudi Arabia",
    "Medina, Saudi Arabia", "Dammam, Saudi Arabia", "Khobar, Saudi Arabia",
    "Tel Aviv, Israel", "Jerusalem, Israel", "Haifa, Israel", "Eilat, Israel",
    "Doha, Qatar", "Al Rayyan, Qatar", "Wakra, Qatar", "Khor, Qatar",
    "Kuwait City, Kuwait", "Manama, Bahrain", "Muscat, Oman",
    
    // Asia
    "Tokyo, Japan", "Osaka, Japan", "Kyoto, Japan", "Yokohama, Japan",
    "Nagoya, Japan", "Sapporo, Japan", "Fukuoka, Japan", "Kobe, Japan",
    "Seoul, South Korea", "Busan, South Korea", "Incheon, South Korea",
    "Daegu, South Korea", "Daejeon, South Korea", "Gwangju, South Korea",
    "Beijing, China", "Shanghai, China", "Guangzhou, China", "Shenzhen, China",
    "Chengdu, China", "Hangzhou, China", "Wuhan, China", "Xian, China",
    "Chongqing, China", "Tianjin, China", "Nanjing, China", "Shenyang, China",
    "Hong Kong, Hong Kong", "Macau, Macau", "Taipei, Taiwan", "Kaohsiung, Taiwan",
    "Singapore, Singapore", "Bangkok, Thailand", "Phuket, Thailand",
    "Chiang Mai, Thailand", "Pattaya, Thailand", "Koh Samui, Thailand",
    "Kuala Lumpur, Malaysia", "Penang, Malaysia", "Johor Bahru, Malaysia",
    "Malacca, Malaysia", "Ipoh, Malaysia", "Kuching, Malaysia",
    "Jakarta, Indonesia", "Bali, Indonesia", "Surabaya, Indonesia",
    "Bandung, Indonesia", "Medan, Indonesia", "Semarang, Indonesia",
    "Manila, Philippines", "Cebu, Philippines", "Davao, Philippines",
    "Ho Chi Minh City, Vietnam", "Hanoi, Vietnam", "Da Nang, Vietnam",
    "Phnom Penh, Cambodia", "Siem Reap, Cambodia", "Vientiane, Laos",
    "Yangon, Myanmar", "Mandalay, Myanmar", "Bagan, Myanmar",
    
    // Oceania
    "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Perth, Australia",
    "Adelaide, Australia", "Gold Coast, Australia", "Canberra, Australia",
    "Newcastle, Australia", "Wollongong, Australia", "Geelong, Australia",
    "Auckland, New Zealand", "Wellington, New Zealand", "Christchurch, New Zealand",
    "Queenstown, New Zealand", "Rotorua, New Zealand", "Dunedin, New Zealand",
    
    // Americas (non-USA)
    "Toronto, Canada", "Montreal, Canada", "Vancouver, Canada", "Calgary, Canada",
    "Edmonton, Canada", "Ottawa, Canada", "Winnipeg, Canada", "Quebec City, Canada",
    "Mexico City, Mexico", "Guadalajara, Mexico", "Monterrey, Mexico",
    "Cancun, Mexico", "Puerto Vallarta, Mexico", "Playa del Carmen, Mexico",
    "São Paulo, Brazil", "Rio de Janeiro, Brazil", "Brasília, Brazil",
    "Salvador, Brazil", "Fortaleza, Brazil", "Recife, Brazil",
    "Belém, Brazil", "Manaus, Brazil", "Porto Alegre, Brazil",
    "Buenos Aires, Argentina", "Córdoba, Argentina", "Rosario, Argentina",
    "Mendoza, Argentina", "La Plata, Argentina", "Mar del Plata, Argentina",
    "Santiago, Chile", "Valparaíso, Chile", "Concepción, Chile",
    "La Serena, Chile", "Antofagasta, Chile", "Puerto Montt, Chile",
    "Lima, Peru", "Cusco, Peru", "Arequipa, Peru", "Trujillo, Peru",
    "Bogotá, Colombia", "Medellín, Colombia", "Cali, Colombia",
    "Cartagena, Colombia", "Barranquilla, Colombia", "Pereira, Colombia",
    "Caracas, Venezuela", "Maracaibo, Venezuela", "Valencia, Venezuela",
    "Maracaibo, Venezuela", "Barquisimeto, Venezuela", "Mérida, Venezuela"
]

export default function CreateItineraryPage() {
    const router = useRouter()
    const { status } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0])
    const [step, setStep] = useState(1)
    const [locationLoading, setLocationLoading] = useState(false)
    const [travelerCounts, setTravelerCounts] = useState<Record<string, number>>({
        Adults: 1,
        Children: 0,
        Teens: 0,
        Seniors: 0,
    })

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [activeField, setActiveField] = useState<"from" | "to" | null>(null)
    const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
    const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([])
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    const form = useForm<ItineraryInput>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: {
            destination: "",
            origin: "",
            numDays: 0,
            budget: "Moderate",
            ageGroups: ["Adults"],
            partySize: 1,
            activityLevel: "Moderate",
            dietaryRestrictions: [],
            accessibilityNeeds: [],
            interests: [],
            startDate: undefined,
            endDate: undefined,
        },
    })

    // Cycle loading messages
    useEffect(() => {
        if (!isLoading) return
        let idx = 0
        const interval = setInterval(() => {
            idx = (idx + 1) % LOADING_MESSAGES.length
            setLoadingMessage(LOADING_MESSAGES[idx])
        }, 3000)
        return () => clearInterval(interval)
    }, [isLoading])

    // Update form when traveler counts change
    useEffect(() => {
        const activeGroups = Object.entries(travelerCounts)
            .filter(([_, count]) => count > 0)
            .map(([type]) => type as "Adults" | "Children" | "Teens" | "Seniors")
        const totalPeople = Object.values(travelerCounts).reduce((a, b) => a + b, 0)
        form.setValue("ageGroups", activeGroups.length > 0 ? activeGroups : ["Adults"])
        form.setValue("partySize", totalPeople > 0 ? totalPeople : 1)
    }, [travelerCounts, form])

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.city-suggestions-dropdown')) {
                setShowOriginSuggestions(false)
                setShowDestinationSuggestions(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (status === "unauthenticated") {
        return null
    }

    const nextStep = async () => {
        const fieldsToValidate: (keyof ItineraryInput)[] = []
        switch (step) {
            case 1: break // origin is optional — skip freely
            case 2: fieldsToValidate.push("destination"); break
            case 3: fieldsToValidate.push("numDays"); break
            case 4: fieldsToValidate.push("budget"); break
            case 5: fieldsToValidate.push("ageGroups", "partySize"); break
            case 6: fieldsToValidate.push("activityLevel"); break
        }
        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) setStep((prev) => Math.min(prev + 1, STEPS.length))
    }

    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

    async function onSubmit(data: ItineraryInput) {
        setIsLoading(true)
        setLoadingMessage(LOADING_MESSAGES[0])
        
        // Add timeout for better UX
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timed out. Please try again.")), 60000)
        })
        
        try {
            const response = await Promise.race([
                fetch("/api/itinerary/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }),
                timeoutPromise
            ]) as Response
            
            if (!response.ok) {
                const text = await response.text()
                try {
                    const error = JSON.parse(text)
                    throw new Error(error.error || error.message || "Failed to generate itinerary")
                } catch {
                    throw new Error(`API returned ${response.status}`)
                }
            }
            const result = await response.json()
            toast.success("Your itinerary is ready!")
            router.push(`/itinerary/${result.itineraryId}`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Something went wrong"
            toast.error(errorMessage)
            setIsLoading(false)
        }
    }

    const handleDetectLocation = async (fieldOnChange: (val: string) => void) => {
        setLocationLoading(true)

        const fallbackToIPLocation = async () => {
            try {
                // Call our own server-side API to bypass browser adblockers entirely!
                const res = await fetch("/api/location")
                if (!res.ok) throw new Error("Location API failed")
                
                const data = await res.json()
                
                if (data.city) {
                    const formatted = data.country ? `${data.city}, ${data.country}` : data.city
                    fieldOnChange(formatted)
                    toast.success(`📍 Location detected: ${data.city}`)
                } else {
                    throw new Error("Invalid IP location data")
                }
            } catch (error) {
                console.error("Server IP Geolocator failed:", error)
                toast.error("Location access completely blocked. Please type your city manually.")
            } finally {
                setLocationLoading(false)
            }
        }

        if (!navigator.geolocation) {
            await fallbackToIPLocation()
            return
        }

        // Request location with better options
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    console.log("Got coordinates:", { latitude, longitude })

                    // Send accurate browser GPS coordinates securely to our own backend API 
                    // This guarantees we get the exact city (not the ISP hub city) and bypasses adblockers!
                    const res = await fetch(`/api/location?lat=${latitude}&lon=${longitude}`)

                    if (!res.ok) {
                        throw new Error(`Location API failed: ${res.status}`)
                    }

                    const data = await res.json()
                    console.log("Location detected API response:", data)

                    if (data.city) {
                        const formatted = data.country ? `${data.city}, ${data.country}` : data.city
                        fieldOnChange(formatted)
                        toast.success(`📍 Location detected: ${data.city}`)
                        console.log("Successfully detected location:", formatted)
                        setLocationLoading(false)
                    } else {
                        // Last resort — use coordinates as fallback
                        const coordFallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                        fieldOnChange(coordFallback)
                        toast.success(`📍 Location detected: ${coordFallback}`)
                        console.log("Using coordinates as fallback:", coordFallback)
                        setLocationLoading(false)
                    }
                } catch (error) {
                    console.error("Location detection error:", error)
                    await fallbackToIPLocation()
                }
            },
            async (err) => {
                console.error("Geolocation error:", err)
                await fallbackToIPLocation()
            },
            {
                timeout: 15000,
                maximumAge: 300000, // 5 minutes
                enableHighAccuracy: true
            }
        )
    }

    // City suggestion functions
    const handleCityInputChange = (value: string, type: 'origin' | 'destination') => {
        if (!value.trim()) {
            if (type === 'origin') {
                setOriginSuggestions([])
                setShowOriginSuggestions(false)
            } else {
                setDestinationSuggestions([])
                setShowDestinationSuggestions(false)
            }
            return
        }

        const filtered = CITY_DATABASE.filter(city => 
            city.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 8)

        if (type === 'origin') {
            setOriginSuggestions(filtered)
            setShowOriginSuggestions(true)
        } else {
            setDestinationSuggestions(filtered)
            setShowDestinationSuggestions(true)
        }
    }

    const handleCitySelect = (city: string, type: 'origin' | 'destination') => {
        if (type === 'origin') {
            form.setValue('origin', city)
            setOriginSuggestions([])
            setShowOriginSuggestions(false)
        } else {
            form.setValue('destination', city)
            setDestinationSuggestions([])
            setShowDestinationSuggestions(false)
        }
    }

    const updateTravelerCount = (type: string, delta: number) => {
        setTravelerCounts((prev) => {
            const current = prev[type] || 0
            const newValue = Math.max(0, current + delta)
            const otherTotal = Object.entries(prev)
                .filter(([k]) => k !== type)
                .reduce((sum, [_, val]) => sum + val, 0)
            if (newValue === 0 && otherTotal === 0) return prev
            return { ...prev, [type]: newValue }
        })
    }

    const CurrentIcon = STEPS[step - 1].icon

    return (
        <div className="min-h-screen relative">
            {/* Travel-themed background */}
            {/* Premium Background */}
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">

                {/* Loading Overlay */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8"
                            >
                                <Mountain className="w-10 h-10 text-primary" />
                            </motion.div>
                            <motion.p
                                key={loadingMessage}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-lg text-muted-foreground"
                            >
                                {loadingMessage}
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Home className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-display text-lg font-semibold">MTA</span>
                        </Link>
                        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </Link>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {STEPS.map((s) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    s.id === step ? "w-8 bg-primary" : s.id < step ? "bg-primary" : "bg-border"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-2xl mx-auto px-4 pb-8">
                    <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-soft">
                        {/* Step Header */}
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <CurrentIcon className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
                                {STEPS[step - 1].title}
                            </h1>
                            <p className="text-muted-foreground">
                                {STEPS[step - 1].description}
                            </p>
                        </div>

                        {/* Form Content */}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="min-h-[280px] flex flex-col justify-center"
                                    >
                                        {/* Step 1: Origin City */}
                                        {step === 1 && (
                                            <FormField
                                                control={form.control}
                                                name="origin"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-4">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="e.g. Mumbai, India"
                                                                    className="h-14 text-lg text-center rounded-2xl"
                                                                    autoFocus
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e)
                                                                        handleCityInputChange(e.target.value, 'origin')
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault()
                                                                            nextStep()
                                                                        }
                                                                    }}
                                                                />
                                                                {/* City Suggestions Dropdown */}
                                                                {showOriginSuggestions && originSuggestions.length > 0 && (
                                                                    <div className="city-suggestions-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                                        {originSuggestions.map((city, index) => (
                                                                            <button
                                                                                key={city}
                                                                                type="button"
                                                                                onClick={() => handleCitySelect(city, 'origin')}
                                                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                                                    <span className="text-sm">{city}</span>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-center" />
                                                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                                                            <button
                                                                type="button"
                                                                disabled={locationLoading}
                                                                onClick={() => handleDetectLocation(field.onChange)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-primary bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 w-full justify-center mb-1"
                                                            >
                                                                {locationLoading ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <LocateFixed className="w-4 h-4" />
                                                                )}
                                                                {locationLoading ? "Detecting your location..." : "📍 Use My Current Location"}
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap justify-center gap-2">
                                                            {["Mumbai, India", "Delhi, India", "Bangalore, India", "Hyderabad, India", "Chennai, India", "Kolkata, India", "Pune, India", "Jaipur, India"].map((city) => (
                                                                <button
                                                                    key={city}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(city)
                                                                        nextStep()
                                                                    }}
                                                                    className="px-4 py-2 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                                                                >
                                                                    {city}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-center text-xs text-muted-foreground pt-1">
                                                            Used to estimate flight costs — optional, you can skip.
                                                        </p>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Step 2: Destination */}
                                        {step === 2 && (
                                            <FormField
                                                control={form.control}
                                                name="destination"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-4">
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="e.g. Tokyo, Japan"
                                                                    className="h-14 text-lg text-center rounded-2xl"
                                                                    autoFocus
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e)
                                                                        handleCityInputChange(e.target.value, 'destination')
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault()
                                                                            nextStep()
                                                                        }
                                                                    }}
                                                                />
                                                                {/* City Suggestions Dropdown */}
                                                                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                                                                    <div className="city-suggestions-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                                        {destinationSuggestions.map((city, index) => (
                                                                            <button
                                                                                key={city}
                                                                                type="button"
                                                                                onClick={() => handleCitySelect(city, 'destination')}
                                                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                                                    <span className="text-sm">{city}</span>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-center" />
                                                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                                                            {["Delhi, India", "Ayodhya, India", "Kathmandu, Nepal", "Moscow, Russia", "Paris, France", "Bali, Indonesia", "New York, USA", "Rome, Italy"].map((dest) => (
                                                                <button
                                                                    key={dest}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(dest)
                                                                        nextStep()
                                                                    }}
                                                                    className="px-4 py-2 text-sm rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                                                                >
                                                                    {dest}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Step 3: Duration */}
                                        {step === 3 && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="numDays"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-6">
                                                            {/* Date Display Columns */}
                                                            <div className="relative">
                                                                {/* Backdrop for closing popup */}
                                                                {activeField && (
                                                                    <div
                                                                        className="fixed inset-0 z-10 bg-transparent"
                                                                        onClick={() => setActiveField(null)}
                                                                    />
                                                                )}

                                                                {/* Date Display Columns */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-0">
                                                                    <div
                                                                        onClick={() => {
                                                                            setActiveField("from")
                                                                        }}
                                                                        className={cn(
                                                                            "p-4 rounded-2xl border cursor-pointer transition-all duration-300",
                                                                            activeField === "from"
                                                                                ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                                                                : dateRange?.from
                                                                                    ? "bg-primary/5 border-primary/20"
                                                                                    : "bg-secondary/30 border-border hover:border-primary/50"
                                                                        )}
                                                                    >
                                                                        <p className={cn("text-sm mb-1 transition-colors", activeField === "from" ? "text-primary font-medium" : "text-muted-foreground")}>
                                                                            Start Date
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <CalendarIcon className={cn("w-4 h-4 transition-colors", activeField === "from" ? "text-primary" : "text-primary/50")} />
                                                                            <p className={cn("font-medium text-lg", !dateRange?.from && "text-muted-foreground")}>
                                                                                {dateRange?.from ? format(dateRange.from, "EEE, MMM d") : "Select date"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        onClick={() => {
                                                                            if (dateRange?.from) setActiveField("to")
                                                                        }}
                                                                        className={cn(
                                                                            "p-4 rounded-2xl border transition-all duration-300",
                                                                            !dateRange?.from ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                                                            activeField === "to"
                                                                                ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                                                                                : dateRange?.to
                                                                                    ? "bg-primary/5 border-primary/20"
                                                                                    : "bg-secondary/30 border-border hover:border-primary/50"
                                                                        )}
                                                                    >
                                                                        <p className={cn("text-sm mb-1 transition-colors", activeField === "to" ? "text-primary font-medium" : "text-muted-foreground")}>
                                                                            End Date
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <CalendarIcon className={cn("w-4 h-4 transition-colors", activeField === "to" ? "text-primary" : "text-primary/50")} />
                                                                            <p className={cn("font-medium text-lg", !dateRange?.to && "text-muted-foreground")}>
                                                                                {dateRange?.to ? format(dateRange.to, "EEE, MMM d") : "Select date"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Calendar Popup */}
                                                                <AnimatePresence>
                                                                    {activeField && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="absolute z-20 left-0 right-0 top-[calc(100%+1rem)] flex justify-center"
                                                                        >
                                                                            <div className="p-6 bg-background rounded-3xl border border-border shadow-soft shadow-xl w-full max-w-[450px]">
                                                                                <Calendar
                                                                                    mode="range"
                                                                                    defaultMonth={dateRange?.from}
                                                                                    selected={dateRange}
                                                                                    onSelect={(value) => {
                                                                                        const range = value as { from?: Date; to?: Date } | undefined
                                                                                        setDateRange(range as DateRange)

                                                                                        if (activeField === "from" && range?.from) {
                                                                                            if (!range.to) setActiveField("to")
                                                                                            else setActiveField(null)
                                                                                        } else if (activeField === "to" && range?.to) {
                                                                                            setActiveField(null)
                                                                                        }

                                                                                        if (range?.from && range?.to) {
                                                                                            const days = differenceInDays(range.to, range.from) + 1
                                                                                            if (days > 0) {
                                                                                                field.onChange(days)
                                                                                                form.setValue("startDate", range.from.toISOString())
                                                                                                form.setValue("endDate", range.to.toISOString())
                                                                                            }
                                                                                        } else {
                                                                                            field.onChange(0)
                                                                                            form.setValue("startDate", undefined)
                                                                                            form.setValue("endDate", undefined)
                                                                                        }
                                                                                    }}
                                                                                    disabled={(date) => {
                                                                                        const today = new Date(new Date().setHours(0, 0, 0, 0))
                                                                                        if (activeField === "to" && dateRange?.from) {
                                                                                            return date < new Date(new Date(dateRange.from).setHours(0, 0, 0, 0))
                                                                                        }
                                                                                        return date < today
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            {/* Total Days Summary */}
                                                            <div className="text-center">
                                                                <AnimatePresence mode="wait">
                                                                    {field.value > 0 ? (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary"
                                                                        >
                                                                            <Activity className="w-4 h-4" />
                                                                            <span className="font-semibold text-lg">
                                                                                {field.value} {field.value === 1 ? "Day" : "Days"} Trip
                                                                            </span>
                                                                        </motion.div>
                                                                    ) : (
                                                                        <motion.p
                                                                            initial={{ opacity: 0 }}
                                                                            animate={{ opacity: 1 }}
                                                                            className="text-muted-foreground italic"
                                                                        >
                                                                            Select dates to calculate duration
                                                                        </motion.p>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            <ClimatePreview
                                                                destination={form.watch("destination")}
                                                                startDate={form.watch("startDate")}
                                                                endDate={form.watch("endDate")}
                                                            />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Step 4: Budget */}
                                        {step === 4 && (
                                            <FormField
                                                control={form.control}
                                                name="budget"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {BUDGET_OPTIONS.map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(option.value)
                                                                        nextStep()
                                                                    }}
                                                                    className={cn(
                                                                        "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50",
                                                                        field.value === option.value
                                                                            ? "border-primary bg-primary/5"
                                                                            : "border-border hover:bg-secondary/50"
                                                                    )}
                                                                >
                                                                    <p className="font-semibold mb-1">{option.label}</p>
                                                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Step 5: Travelers */}
                                        {step === 5 && (
                                            <div className="space-y-4">
                                                {TRAVELER_TYPES.map((type) => (
                                                    <div
                                                        key={type.id}
                                                        className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{type.label}</p>
                                                            <p className="text-sm text-muted-foreground">{type.description}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                onClick={() => updateTravelerCount(type.id, -1)}
                                                                disabled={travelerCounts[type.id] === 0}
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="w-8 text-center font-semibold">
                                                                {travelerCounts[type.id]}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                onClick={() => updateTravelerCount(type.id, 1)}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <p className="text-center text-sm text-muted-foreground">
                                                    Total: <span className="font-semibold text-foreground">{form.watch("partySize")} travelers</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* Step 6: Pace */}
                                        {step === 6 && (
                                            <FormField
                                                control={form.control}
                                                name="activityLevel"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {PACE_OPTIONS.map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(option.value)
                                                                        nextStep()
                                                                    }}
                                                                    className={cn(
                                                                        "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50",
                                                                        field.value === option.value
                                                                            ? "border-primary bg-primary/5"
                                                                            : "border-border hover:bg-secondary/50"
                                                                    )}
                                                                >
                                                                    <p className="font-semibold mb-1">{option.label}</p>
                                                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Step 7: Preferences */}
                                        {step === 7 && (
                                            <div className="space-y-6">
                                                {/* Interests */}
                                                <div>
                                                    <p className="label mb-3">Interests</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {INTEREST_OPTIONS.map((interest) => {
                                                            const current = form.watch("interests")
                                                            const isSelected = current.includes(interest)
                                                            return (
                                                                <button
                                                                    key={interest}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            form.setValue("interests", current.filter((i) => i !== interest))
                                                                        } else {
                                                                            form.setValue("interests", [...current, interest])
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                        isSelected
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border hover:border-primary/50"
                                                                    )}
                                                                >
                                                                    {interest}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Dietary */}
                                                <div>
                                                    <p className="label mb-3">Dietary Needs</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {DIETARY_OPTIONS.map((diet) => {
                                                            const current = form.watch("dietaryRestrictions")
                                                            const isSelected = current.includes(diet)
                                                            return (
                                                                <button
                                                                    key={diet}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            form.setValue("dietaryRestrictions", current.filter((d) => d !== diet))
                                                                        } else {
                                                                            form.setValue("dietaryRestrictions", [...current, diet])
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                        isSelected
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border hover:border-primary/50"
                                                                    )}
                                                                >
                                                                    {diet}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Accessibility */}
                                                <div>
                                                    <p className="label mb-3">Accessibility</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ACCESSIBILITY_OPTIONS.map((need) => {
                                                            const current = form.watch("accessibilityNeeds")
                                                            const isSelected = current.includes(need)
                                                            return (
                                                                <button
                                                                    key={need}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            form.setValue("accessibilityNeeds", current.filter((n) => n !== need))
                                                                        } else {
                                                                            form.setValue("accessibilityNeeds", [...current, need])
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                                                        isSelected
                                                                            ? "bg-primary text-primary-foreground border-primary"
                                                                            : "bg-background border-border hover:border-primary/50"
                                                                    )}
                                                                >
                                                                    {need}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                <p className="text-center text-sm text-muted-foreground">
                                                    All preferences are optional
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation */}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        disabled={step === 1 || isLoading}
                                        className={cn("gap-2", step === 1 && "invisible")}
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </Button>

                                    {step < STEPS.length ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="gap-2 rounded-full px-6"
                                            disabled={step === 3 && form.watch("numDays") === 0}
                                        >
                                            Next <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="gap-2 rounded-full px-6"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate Itinerary
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>
                </div >
            </div >
        </div >
    )
}
