export default function AdminTripsLoading() {
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
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div>
                            <div className="w-24 h-4 rounded bg-muted animate-pulse mb-2" />
                            <div className="w-32 h-10 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="w-36 h-10 rounded-full bg-muted animate-pulse" />
                    </div>

                    {/* Table skeleton */}
                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
                            <div className="w-40 h-4 rounded bg-muted animate-pulse" />
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/30">
                                <tr>
                                    {["User", "Destination", "Dates", "Status", "Action"].map((h) => (
                                        <th key={h} className="px-6 py-3">
                                            <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4">
                                            <div className="w-28 h-4 rounded bg-muted animate-pulse mb-1" />
                                            <div className="w-36 h-3 rounded bg-muted animate-pulse" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24 h-4 rounded bg-muted animate-pulse" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-40 h-3 rounded bg-muted animate-pulse" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="w-12 h-4 rounded bg-muted animate-pulse ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
