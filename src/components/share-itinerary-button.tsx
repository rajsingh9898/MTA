"use client"

import { useState } from "react"
import { Share2, Copy, Check, Link2Off } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ShareItineraryButtonProps {
    itineraryId: string
    initialShareUrl?: string | null
    initialIsPublic?: boolean
}

export function ShareItineraryButton({
    itineraryId,
    initialShareUrl = null,
    initialIsPublic = false
}: ShareItineraryButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [shareUrl, setShareUrl] = useState<string | null>(initialShareUrl)
    const [isPublic, setIsPublic] = useState(initialIsPublic)
    const [copied, setCopied] = useState(false)

    const handleToggleSharing = async (enable: boolean) => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/itinerary/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itineraryId,
                    enableSharing: enable
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update sharing settings")
            }

            const result = await response.json()
            setShareUrl(result.shareUrl)
            setIsPublic(result.isPublic)

            if (enable) {
                toast.success("Sharing enabled! Copy the link to share.")
            } else {
                toast.success("Sharing disabled.")
            }
        } catch (error) {
            toast.error("Failed to update sharing settings")
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success("Link copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 bg-black/5 border-black/10 text-black hover:bg-black hover:text-white transition-colors"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Itinerary</DialogTitle>
                    <DialogDescription>
                        {isPublic
                            ? "Anyone with the link can view this itinerary."
                            : "Enable sharing to generate a public link."}
                    </DialogDescription>
                </DialogHeader>

                {isPublic && shareUrl ? (
                    <div className="flex items-center space-x-2">
                        <Input
                            readOnly
                            value={shareUrl}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="icon"
                            onClick={copyToClipboard}
                            className="shrink-0"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                ) : (
                    <div className="py-6 text-center text-muted-foreground">
                        Click below to enable sharing and generate a link.
                    </div>
                )}

                <DialogFooter className="sm:justify-between">
                    {isPublic ? (
                        <Button
                            variant="destructive"
                            onClick={() => handleToggleSharing(false)}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <Link2Off className="h-4 w-4" />
                            Disable Sharing
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleToggleSharing(true)}
                            disabled={isLoading}
                            className="gap-2 w-full"
                        >
                            <Share2 className="h-4 w-4" />
                            {isLoading ? "Generating..." : "Enable Sharing"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
