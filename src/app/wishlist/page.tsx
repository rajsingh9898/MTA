"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Heart, Plus, Share2, Trash2, Calendar, MapPin, Lock, Search, SortAsc, SortDesc, Filter } from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
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
  description: string | null
  isPublic: boolean
  shareToken: string | null
  createdAt: string
  items: any[]
}

export default function WishlistPage() {
  const router = useRouter()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newWishlistName, setNewWishlistName] = useState("")
  const [newWishlistDescription, setNewWishlistDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date" | "items">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    fetchWishlists()
  }, [])

  const fetchWishlists = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/wishlist")
      const data = await response.json()
      if (data.success) {
        setWishlists(data.data)
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWishlistName,
          description: newWishlistDescription || undefined,
          isPublic: false,
        }),
      })

      if (response.ok) {
        setNewWishlistName("")
        setNewWishlistDescription("")
        setIsDialogOpen(false)
        fetchWishlists()
      }
    } catch (error) {
      console.error("Error creating wishlist:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemoveItem = async (wishlistId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${wishlistId}/items?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchWishlists()
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const handleDeleteWishlist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wishlist?")) return

    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setWishlists(wishlists.filter(w => w.id !== id))
      }
    } catch (error) {
      console.error("Error deleting wishlist:", error)
    }
  }

  const handleShareWishlist = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/wishlist/share/${shareToken}`
    navigator.clipboard.writeText(shareUrl)
    alert("Share link copied to clipboard!")
  }

  // Filter and sort wishlists
  const filteredAndSortedWishlists = useMemo(() => {
    let filtered = wishlists

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(wishlist =>
        wishlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wishlist.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wishlist.items.some((item: any) =>
          item.itinerary.destination.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Sort wishlists
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "items":
          comparison = a.items.length - b.items.length
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return sorted
  }, [wishlists, searchQuery, sortBy, sortOrder])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWishlists = wishlists.length
    const totalTrips = wishlists.reduce((sum, w) => sum + w.items.length, 0)
    const publicWishlists = wishlists.filter(w => w.isPublic).length
    const avgTripsPerWishlist = totalWishlists > 0 ? (totalTrips / totalWishlists).toFixed(1) : 0

    return {
      totalWishlists,
      totalTrips,
      publicWishlists,
      avgTripsPerWishlist,
    }
  }, [wishlists])

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-premium" />
      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Statistics Panel */}
          {showStats && wishlists.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-border/60 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Wishlists</p>
                <p className="text-2xl font-bold">{stats.totalWishlists}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Trips</p>
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Public Lists</p>
                <p className="text-2xl font-bold">{stats.publicWishlists}</p>
              </div>
              <div className="bg-card border border-border/60 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg Trips/List</p>
                <p className="text-2xl font-bold">{stats.avgTripsPerWishlist}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
              <p className="text-muted-foreground mb-1">Your Collections</p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Wishlists
              </h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Wishlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wishlist</DialogTitle>
                  <DialogDescription>
                    Create a new collection to save your favorite trips.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Wishlist Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer 2024, Weekend Trips"
                      value={newWishlistName}
                      onChange={(e) => setNewWishlistName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add a description for your wishlist..."
                      value={newWishlistDescription}
                      onChange={(e) => setNewWishlistDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleCreateWishlist}
                    disabled={!newWishlistName.trim() || isCreating}
                    className="w-full"
                  >
                    {isCreating ? "Creating..." : "Create Wishlist"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Sort Controls */}
          {wishlists.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search wishlists or destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "date" | "items")}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="items">Sort by Trips</option>
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                >
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowStats(!showStats)}
                  title="Toggle Statistics"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredAndSortedWishlists.length === 0 && wishlists.length > 0 ? (
            <div className="bg-card border border-border/60 rounded-2xl p-12 text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No results found</h2>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={() => setSearchQuery("")} variant="outline">
                Clear Search
              </Button>
            </div>
          ) : filteredAndSortedWishlists.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No wishlists yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first wishlist to save your favorite trips
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Wishlist
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedWishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6 border-b border-border/60">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{wishlist.name}</h3>
                      <div className="flex items-center gap-2">
                        {wishlist.isPublic && (
                          <button 
                            onClick={() => handleShareWishlist(wishlist.shareToken!)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Share wishlist"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteWishlist(wishlist.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {wishlist.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {wishlist.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {wishlist.items.length} trips
                      </span>
                      {wishlist.isPublic && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Public
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-border/60 max-h-80 overflow-y-auto">
                    {wishlist.items.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No trips saved yet
                      </div>
                    ) : (
                      wishlist.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                                <span className="font-medium text-sm truncate">
                                  {item.itinerary.destination}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  {item.itinerary.startDate
                                    ? new Date(item.itinerary.startDate).toLocaleDateString()
                                    : "No date"}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <button 
                              onClick={() => handleRemoveItem(wishlist.id, item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
