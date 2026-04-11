import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/ui/navbar"
import { Heart, Plus, Share2, Trash2, Calendar, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/login")
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          itinerary: {
            include: {
              user: {
                select: {
                  id: true,
              name: true,
              email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-premium" />
      <div className="relative z-10">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <p className="text-muted-foreground mb-1">Your Collections</p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Wishlists
              </h1>
            </div>
            <button className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Wishlist
            </button>
          </div>

          {wishlists.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No wishlists yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first wishlist to save your favorite trips
              </p>
              <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Wishlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6 border-b border-border/60">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{wishlist.name}</h3>
                      <div className="flex items-center gap-2">
                        {wishlist.isPublic && (
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="text-muted-foreground hover:text-destructive transition-colors">
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
                            <button className="text-muted-foreground hover:text-destructive transition-colors">
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
