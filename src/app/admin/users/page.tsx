import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/ui/navbar"
import { Users, UserCheck, UserPlus, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        redirect("/login")
    }

    const [totalUsers, verifiedUsers, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                city: true,
                phoneNumber: true,
                isVerified: true,
                createdAt: true,
            },
        }),
    ])

    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-hero-premium" />

            <div className="relative z-10">
                <Navbar />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                        <div>
                            <p className="text-muted-foreground mb-1">Admin Module</p>
                            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Users</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                                Back to Overview
                            </Link>
                            <Link href="/admin/trips" className="px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
                                Manage Trips
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Users</p>
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <p className="font-display text-3xl font-semibold">{totalUsers}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Verified Users</p>
                                <UserCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="font-display text-3xl font-semibold">{verifiedUsers}</p>
                        </div>
                        <div className="bg-card border border-border/60 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pending Verification</p>
                                <UserPlus className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="font-display text-3xl font-semibold">{Math.max(totalUsers - verifiedUsers, 0)}</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                            <h2 className="font-semibold text-sm">Recent User Signups</h2>
                            <Link href="/admin/trips" className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1">
                                View Trips <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">City</th>
                                        <th className="px-6 py-3">Phone Number</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {recentUsers.map((user: (typeof recentUsers)[number]) => (
                                        <tr key={user.id} className="hover:bg-muted/20">
                                            <td className="px-6 py-3">{user.name || "Unnamed User"}</td>
                                            <td className="px-6 py-3 text-muted-foreground">{user.email}</td>
                                            <td className="px-6 py-3">{user.city || "-"}</td>
                                            <td className="px-6 py-3">{user.phoneNumber || "-"}</td>
                                            <td className="px-6 py-3">
                                                <span className={user.isVerified ? "text-green-600 text-xs font-semibold" : "text-amber-600 text-xs font-semibold"}>
                                                    {user.isVerified ? "Verified" : "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
