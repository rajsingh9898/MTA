export default function AdminHotelsLoading() {
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
                            <div className="w-28 h-10 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
                            <div className="w-32 h-10 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>

                    {/* Info card */}
                    <div className="bg-card border border-border/60 rounded-2xl p-6 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                            <div className="flex-1">
                                <div className="w-48 h-5 rounded bg-muted animate-pulse mb-2" />
                                <div className="w-72 h-3 rounded bg-muted animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Quick check cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-28 h-4 rounded bg-muted animate-pulse" />
                                    <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="w-44 h-3 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Bottom link card */}
                    <div className="bg-card border border-border/60 rounded-2xl p-6">
                        <div className="w-40 h-4 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}
