import Link from "next/link"
import { CalendarDays, MapPin, Users, Wallet } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface ItineraryCardProps {
    itinerary: {
        id: string
        destination: string
        numDays: number
        budget: string
        partySize: number
        createdAt: Date
    }
}

export function ItineraryCard({ itinerary }: ItineraryCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group hover:-translate-y-1">
            <div className="h-32 bg-gradient-to-br from-primary/20 to-teal-600/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                </div>
            </div>
            <CardHeader className="relative -mt-12 pt-0 px-6">
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border/50">
                    <CardTitle className="text-xl font-bold line-clamp-1">
                        {itinerary.destination}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 px-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Duration</span>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            <span>{itinerary.numDays} Days</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Travelers</span>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{itinerary.partySize} People</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Budget</span>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span>{itinerary.budget}</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground border-t border-border/50 pt-4">
                    Created on {format(new Date(itinerary.createdAt), "MMMM do, yyyy")}
                </div>
            </CardContent>
            <CardFooter className="px-6 pb-6">
                <Button asChild className="w-full shadow-md group-hover:shadow-lg transition-all">
                    <Link href={`/itinerary/${itinerary.id}`}>View Itinerary</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
