"use client"

import { useState, useEffect } from "react"
import { Heart, Plus } from "lucide-react"
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

interface Wishlist {
  id: string
  name: string
}

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
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null)
  const [newWishlistName, setNewWishlistName] = useState("")
  const [showNewWishlist, setShowNewWishlist] = useState(false)
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingWishlists, setIsFetchingWishlists] = useState(false)

  useEffect(() => {
    if (isDialogOpen) {
      fetchWishlists()
    }
  }, [isDialogOpen])

  const fetchWishlists = async () => {
    setIsFetchingWishlists(true)
    try {
      const response = await fetch("/api/wishlist")
      const data = await response.json()
      if (data.success) {
        setWishlists(data.data)
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error)
    } finally {
      setIsFetchingWishlists(false)
    }
  }

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWishlistName,
          isPublic: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newWishlist = data.data
        setWishlists([...wishlists, newWishlist])
        setSelectedWishlist(newWishlist.id)
        setNewWishlistName("")
        setShowNewWishlist(false)
      }
    } catch (error) {
      console.error("Error creating wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
        setSelectedWishlist(null)
        setNotes("")
        setShowNewWishlist(false)
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
      const response = await fetch(`/api/wishlist`)
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
        onClick={(e) => {
          e.stopPropagation()
          handleRemoveFromWishlist()
        }}
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
          onClick={(e) => e.stopPropagation()}
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
          {showNewWishlist ? (
            <div className="space-y-2">
              <Label htmlFor="new-wishlist">New Wishlist Name</Label>
              <div className="flex gap-2">
                <Input
                  id="new-wishlist"
                  placeholder="e.g., Summer 2024"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleCreateWishlist()
                  }}
                />
                <Button
                  onClick={handleCreateWishlist}
                  disabled={!newWishlistName.trim() || isLoading}
                  size="icon"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewWishlist(false)
                  setNewWishlistName("")
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="wishlist">Select Wishlist</Label>
              <select
                id="wishlist"
                value={selectedWishlist || ""}
                onChange={(e) => setSelectedWishlist(e.target.value)}
                disabled={isFetchingWishlists}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">
                  {isFetchingWishlists ? "Loading..." : "Select a wishlist..."}
                </option>
                {wishlists.map((wishlist) => (
                  <option key={wishlist.id} value={wishlist.id}>
                    {wishlist.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewWishlist(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Wishlist
              </Button>
            </div>
          )}
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
