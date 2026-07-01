export default function ItineraryLoading() {
    return (
        <div className="min-h-screen relative">
            {/* Premium Background */}
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                {/* Hero skeleton */}
                <div className="relative h-[50vh] min-h-[400px] bg-muted animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                    {/* Back button skeleton */}
                    <div className="absolute top-6 left-6 z-10">
                        <div className="w-28 h-9 rounded-full bg-white/10 backdrop-blur-sm animate-pulse" />
                    </div>

                    {/* Hero content skeleton */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-4 h-4 rounded bg-muted-foreground/20 animate-pulse" />
                                <div className="w-28 h-3 rounded bg-muted-foreground/20 animate-pulse" />
                            </div>
                            <div className="w-72 h-14 rounded bg-muted-foreground/20 animate-pulse mb-4" />
                            <div className="flex flex-wrap gap-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="w-28 h-8 rounded-full bg-black/5 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {/* Actions bar skeleton */}
                    <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-border">
                        <div className="w-24 h-9 rounded bg-muted animate-pulse" />
                        <div className="w-24 h-9 rounded bg-muted animate-pulse" />
                        <div className="flex-1" />
                        <div className="w-16 h-9 rounded bg-muted animate-pulse" />
                        <div className="w-9 h-9 rounded bg-muted animate-pulse" />
                    </div>

                    {/* Overview cards skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-card border border-border/60 rounded-2xl p-5">
                                <div className="w-20 h-3 rounded bg-muted animate-pulse mb-3" />
                                <div className="w-16 h-7 rounded bg-muted animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Day sections skeleton */}
                    {Array.from({ length: 3 }).map((_, dayIdx) => (
                        <div key={dayIdx} className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
                                <div>
                                    <div className="w-20 h-5 rounded bg-muted animate-pulse mb-1" />
                                    <div className="w-32 h-3 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-3 ml-5 border-l-2 border-border/40 pl-6">
                                {Array.from({ length: 3 }).map((_, actIdx) => (
                                    <div key={actIdx} className="bg-card border border-border/60 rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                                            <div className="w-32 h-4 rounded bg-muted animate-pulse" />
                                        </div>
                                        <div className="w-full h-3 rounded bg-muted animate-pulse mb-1" />
                                        <div className="w-3/4 h-3 rounded bg-muted animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
