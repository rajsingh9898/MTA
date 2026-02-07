"use client"

import { PDFDownloadLink } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { PdfDocument } from "@/components/pdf-document"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

interface ItineraryData {
    overview: {
        destination: string
        duration: string
        totalEstimatedCost: string
    }
    days: {
        day: number
        activities: {
            timeSlot: string
            name: string
            description: string
            cost: string
            whyRecommended: string
        }[]
        transportation: string
        dailyCost: string
    }[]
    summary: {
        totalEstimatedCost: string
        totalActivities: number
        keyHighlights: string[]
    }
    tripMetadata?: {
        name?: string
        startDate?: string
        endDate?: string
        userName?: string
    }
}

export function ExportPdfButton({ data }: { data: ItineraryData }) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return (
            <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
            </Button>
        )
    }

    return (
        <PDFDownloadLink
            document={<PdfDocument data={data} />}
            fileName={`MTA_${(data.tripMetadata?.name || data.overview.destination).replace(/\s+/g, "_")}.pdf`}
        >
            {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? "Generating..." : "Export PDF"}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
