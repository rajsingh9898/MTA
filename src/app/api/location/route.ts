import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const lat = searchParams.get("lat")
        const lon = searchParams.get("lon")

        // 1. Accurate Coordinate-based Reverse Geocoding via Server (Bypasses adblockers)
        if (lat && lon) {
            try {
                // Primary: BigDataCloud
                const reverseGeoRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
                )
                
                if (reverseGeoRes.ok) {
                    const geo = await reverseGeoRes.json()
                    const cityName = geo.city || geo.locality || geo.principalSubdivision || ""
                    if (cityName) {
                        return NextResponse.json({
                            city: cityName,
                            country: geo.countryName || ""
                        })
                    }
                }

                // Fallback: Nominatim (Now safer since it's server-side)
                const nominatimRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1&accept-language=en`,
                    {
                        headers: {
                            "Accept-Language": "en",
                            "User-Agent": "MTA-Travel-App/1.0 (Server-Side)"
                        }
                    }
                )
                if (nominatimRes.ok) {
                    const addr = (await nominatimRes.json()).address || {}
                    const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.district || addr.state || ""
                    if (cityName) {
                        return NextResponse.json({
                            city: cityName,
                            country: addr.country || ""
                        })
                    }
                }
            } catch (e) {
                console.error("Server reverse coordinate geocoding failed:", e)
            }
        }

        // 2. IP-based location (No coords provided, or coordinate lookup failed)
        // Try to get location from Vercel headers (most reliable on hosted platform)
        const city = request.headers.get("x-vercel-ip-city")
        const country = request.headers.get("x-vercel-ip-country")
        
        if (city) {
            return NextResponse.json({
                city: decodeURIComponent(city),
                country: country || ""
            })
        }

        // 3. Fallback server-side IP fetch
        const forwardedFor = request.headers.get("x-forwarded-for")
        const realIp = request.headers.get("x-real-ip")
        
        let ip = ""
        if (forwardedFor) {
            ip = forwardedFor.split(",")[0].trim()
        } else if (realIp) {
            ip = realIp.trim()
        }

        let ipUrlPath = ""
        if (ip && ip !== "::1" && ip !== "127.0.0.1" && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
            ipUrlPath = ip
        }

        const res = await fetch(`http://ip-api.com/json/${ipUrlPath}`)
        if (res.ok) {
            const data = await res.json()
            if (data.status === "success" && data.city) {
                return NextResponse.json({
                    city: data.city,
                    country: data.country || ""
                })
            }
        }

        const res2 = await fetch(`https://ipapi.co/${ipUrlPath ? ipUrlPath + '/' : ''}json/`)
        if (res2.ok) {
            const data2 = await res2.json()
            if (data2.city) {
                return NextResponse.json({
                    city: data2.city,
                    country: data2.country_name || ""
                })
            }
        }

        throw new Error("All location detection methods failed")
    } catch (error) {
        console.error("Server IP Geolocation error:", error)
        return NextResponse.json({ error: "Location access denied" }, { status: 500 })
    }
}
