export default function DashboardLoading() {
    return (
        <div className="min-h-screen">
            {/* Premium Background */}
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                {/* Navbar skeleton */}
                <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                                <div className="w-12 h-5 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="hidden md:flex items-center gap-4">
                                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                                <div className="w-20 h-4 rounded bg-muted animate-pulse" />
                                <div className="w-20 h-4 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="h-16" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Header skeleton */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                        <div>
                            <div className="w-20 h-4 rounded bg-muted animate-pulse mb-2" />
                            <div className="w-48 h-10 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="w-40 h-11 rounded-full bg-muted animate-pulse" />
                    </div>

                    {/* Stats bar skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl p-4">
                                <div className="w-20 h-3 rounded bg-muted animate-pulse mb-2" />
                                <div className="w-12 h-8 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Section header skeleton */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-24 h-6 rounded bg-muted animate-pulse" />
                        <div className="w-8 h-5 rounded bg-muted animate-pulse" />
                    </div>

                    {/* Itinerary cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                                <div className="h-48 bg-muted animate-pulse" />
                                <div className="p-4">
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {Array.from({ length: 3 }).map((_, j) => (
                                            <div key={j}>
                                                <div className="w-14 h-3 rounded bg-muted animate-pulse mb-1" />
                                                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                        <div className="w-24 h-3 rounded bg-muted animate-pulse" />
                                        <div className="w-12 h-4 rounded bg-muted animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
