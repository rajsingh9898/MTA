import Link from "next/link"
import { ArrowRight, Mountain } from "lucide-react"

import { Navbar } from "@/components/ui/navbar"
import { Hero } from "@/components/ui/hero"
import { Features } from "@/components/ui/features"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Premium Background */}
        <div className="absolute inset-0" style={{ backgroundColor: "#D1FFFF" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="label text-primary mb-4 block">Get Started</span>
          <h2 className="heading-2 mb-6">
            Ready to plan your next adventure?
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of travelers who trust MTA to create unforgettable journeys. Your perfect trip is just a few clicks away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" className="rounded-full group shadow-premium-medium hover:shadow-premium-strong transition-shadow">
              <Link href="/create">
                Create Your Itinerary
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="rounded-full glass-card hover:shadow-premium-medium transition-shadow">
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Mountain className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display text-xl font-semibold tracking-tight">
                  MTA
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered travel planning for the modern explorer.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/create" className="text-muted-foreground hover:text-foreground transition-colors">
                    Create Trip
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <span className="text-muted-foreground/50">
                    Pricing (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-muted-foreground/50">About</span>
                </li>
                <li>
                  <span className="text-muted-foreground/50">Blog</span>
                </li>
                <li>
                  <span className="text-muted-foreground/50">Careers</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-muted-foreground/50">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-muted-foreground/50">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MTA Planner. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with care for travelers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
