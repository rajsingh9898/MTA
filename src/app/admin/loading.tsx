export default function AdminLoading() {
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
                            <div className="flex items-center gap-2">
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
                            <div className="w-24 h-4 rounded bg-muted animate-pulse mb-2" />
                            <div className="w-36 h-10 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-10 rounded-full bg-muted animate-pulse" />
                            <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>

                    {/* Stats grid skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-20 h-3 rounded bg-muted animate-pulse" />
                                    <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="w-16 h-9 rounded bg-muted animate-pulse mb-2" />
                                <div className="w-28 h-3 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Main content grid skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left column */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
                                <div className="w-40 h-3 rounded bg-muted animate-pulse mb-3" />
                                <div className="w-48 h-12 rounded bg-muted animate-pulse mb-4" />
                                <div className="w-32 h-5 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex-1">
                                <div className="px-6 py-5 border-b border-border/60 bg-muted/20">
                                    <div className="w-36 h-4 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="p-3 grid grid-cols-2 gap-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/40">
                                            <div className="w-10 h-10 rounded-full bg-muted animate-pulse mb-3" />
                                            <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right column - Recent trips */}
                        <div className="lg:col-span-7 bg-card border border-border/60 rounded-2xl overflow-hidden">
                            <div className="px-6 py-5 border-b border-border/60 bg-muted/20">
                                <div className="w-36 h-4 rounded bg-muted animate-pulse" />
                            </div>
                            <div className="divide-y divide-border/60">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="w-28 h-4 rounded bg-muted animate-pulse" />
                                            <div className="w-40 h-3 rounded bg-muted animate-pulse" />
                                        </div>
                                        <div className="w-16 h-6 rounded-full bg-muted animate-pulse" />
                                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
