const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const userCount = await prisma.user.count()
        const itineraryCount = await prisma.itinerary.count()
        console.log(`User Count: ${userCount}`)
        console.log(`Itinerary Count: ${itineraryCount}`)
    } catch (e) {
        console.error('Error counting records:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
