export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5 dark:from-primary/10 dark:via-background dark:to-cyan-900/10 -z-10" />
            <div className="w-full max-w-md space-y-8 relative z-10">{children}</div>
        </div>
    )
}
