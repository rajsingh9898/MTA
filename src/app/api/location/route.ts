import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        // 1. Try to get location from Vercel headers (most reliable on hosted platform)
        const city = request.headers.get("x-vercel-ip-city")
        const country = request.headers.get("x-vercel-ip-country")
        
        if (city) {
            // Vercel handles it natively! 
            // Return decoded city (headers are URI encoded)
            return NextResponse.json({
                city: decodeURIComponent(city),
                country: country || ""
            })
        }

        // 2. If no Vercel headers (e.g. running locally or on another host), try server-side fetch
        const forwardedFor = request.headers.get("x-forwarded-for")
        const realIp = request.headers.get("x-real-ip")
        
        // Grab the first IP if there's a list
        let ip = ""
        if (forwardedFor) {
            ip = forwardedFor.split(",")[0].trim()
        } else if (realIp) {
            ip = realIp.trim()
        }

        // Ignore local IPs for external APIs
        let ipUrlPath = ""
        if (ip && ip !== "::1" && ip !== "127.0.0.1" && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
            ipUrlPath = ip
        }

        // Try IP-API Server Side (super fast, IP-based, no CORS, doesn't get blocked by browser adblockers because it's server-side!)
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

        // Try ipapi.co as a fallback server-side
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
