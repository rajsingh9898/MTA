"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface WishlistButtonProps {
  itineraryId: string
  isWishlisted?: boolean
  onToggle?: (isWishlisted: boolean) => void
}

export function WishlistButton({
  itineraryId,
  isWishlisted = false,
  onToggle,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToWishlist = async () => {
    if (!selectedWishlist) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/wishlist/${selectedWishlist}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId,
          notes: notes || undefined,
        }),
      })

      if (response.ok) {
        setWishlisted(true)
        setIsDialogOpen(false)
        onToggle?.(true)
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromWishlist = async () => {
    setIsLoading(true)
    try {
      // Find the wishlist item and remove it
      const response = await fetch(`/api/wishlist?itineraryId=${itineraryId}`)
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        const wishlist = data.data[0]
        const item = wishlist.items.find((item: any) => item.itineraryId === itineraryId)

        if (item) {
          await fetch(`/api/wishlist/${wishlist.id}/items?itemId=${item.id}`, {
            method: "DELETE",
          })
          setWishlisted(false)
          onToggle?.(false)
        }
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (wishlisted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRemoveFromWishlist}
        disabled={isLoading}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <Heart className="w-5 h-5 fill-current" />
      </Button>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
          <DialogDescription>
            Select a wishlist to add this trip to, or create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="wishlist">Select Wishlist</Label>
            <select
              id="wishlist"
              value={selectedWishlist || ""}
              onChange={(e) => setSelectedWishlist(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Select a wishlist...</option>
              {/* This would be populated with user's wishlists */}
              <option value="new">Create new wishlist...</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this trip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            onClick={handleAddToWishlist}
            disabled={!selectedWishlist || isLoading}
            className="w-full"
          >
            {isLoading ? "Adding..." : "Add to Wishlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
