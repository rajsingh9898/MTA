import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/ui/navbar"
import { Heart, Calendar, MapPin, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const wishlist = await prisma.wishlist.findUnique({
    where: { shareToken: token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
  })

  if (!wishlist || !wishlist.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Wishlist Not Found</h1>
          <p className="text-muted-foreground">
            This wishlist doesn't exist or is not public.
          </p>
        </div>
      </div>
    )
  }

  const session = await auth()
  const isOwner = session?.user?.email === wishlist.user.email

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-hero-premium" />
      <div className="relative z-10">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Shared by {wishlist.user.name || wishlist.user.email}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
              {wishlist.name}
            </h1>
            {wishlist.description && (
              <p className="text-muted-foreground">{wishlist.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {wishlist.items.length} trips
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Public
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {wishlist.items.length === 0 ? (
              <div className="bg-card border border-border/60 rounded-2xl p-12 text-center">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
                <p className="text-muted-foreground">
                  This wishlist doesn't have any trips saved yet.
                </p>
              </div>
            ) : (
              wishlist.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/60 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-lg">
                          {item.itinerary.destination}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {item.itinerary.startDate
                            ? new Date(item.itinerary.startDate).toLocaleDateString()
                            : "No date"}
                        </span>
                        <span>•</span>
                        <span>{item.itinerary.numDays} days</span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
