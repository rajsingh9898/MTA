import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  // Use isAdmin from the JWT token directly (populated in auth.ts jwt callback)
  // This eliminates an extra DB round-trip on every admin page load
  if (!session.user.isAdmin) {
    redirect("/login")
  }
  return session
}