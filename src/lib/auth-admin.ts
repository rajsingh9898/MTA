import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
export async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  })
  if (!user?.isAdmin) {
    redirect("/login")
  }
  return session
}