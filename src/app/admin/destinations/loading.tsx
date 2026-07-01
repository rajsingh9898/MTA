export default function AdminDestinationsLoading() {
    return (
        <div className="min-h-screen">
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
                                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                                <div className="w-16 h-4 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>
                </header>

                <div className="h-16" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <div className="w-24 h-4 rounded bg-muted animate-pulse mb-2" />
                            <div className="w-40 h-10 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
                            <div className="w-44 h-10 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl p-5">
                                <div className="w-32 h-3 rounded bg-muted animate-pulse mb-3" />
                                <div className="w-12 h-9 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Destinations list */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <div className="w-44 h-4 rounded bg-muted animate-pulse" />
                            <div className="w-20 h-3 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="divide-y divide-border/60">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                                        <div className="w-28 h-4 rounded bg-muted animate-pulse" />
                                    </div>
                                    <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
