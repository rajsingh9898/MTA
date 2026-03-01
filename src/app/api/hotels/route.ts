import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get("destination")

    if (!destination) {
        return NextResponse.json({ error: "Destination is required" }, { status: 400 })
    }

    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey) {
        return NextResponse.json({ error: "SerpAPI key is missing" }, { status: 500 })
    }

    // Prepare parameters for Google Hotels API via SerpAPI
    try {
        // google_hotels engine requires check_in_date and check_out_date (YYYY-MM-DD)
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setMonth(checkIn.getMonth() + 1); // Next month
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 1); // 1 night stay

        // Ensure YYYY-MM-DD format strictly
        const formatYMD = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const checkInStr = formatYMD(checkIn);
        const checkOutStr = formatYMD(checkOut);

        const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(destination)}&check_in_date=${checkInStr}&check_out_date=${checkOutStr}&currency=INR&api_key=${apiKey}`
        console.log("Calling SerpAPI Hotel URL:", url.replace(apiKey, "HIDDEN_KEY"));

        const response = await fetch(url)

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`SerpAPI Error detail [${response.status}]:`, errorText);
            throw new Error(`SerpAPI responded with status: ${response.status}`)
        }

        const data = await response.json()

        // Extract the hotels from the response
        if (data.properties && Array.isArray(data.properties)) {
            // Return top 5 properties
            return NextResponse.json({ hotels: data.properties.slice(0, 5) })
        }

        return NextResponse.json({ hotels: [] })
    } catch (error) {
        console.error("Error fetching hotels from SerpAPI:", error)
        return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 })
    }
}
