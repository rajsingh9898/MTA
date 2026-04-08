import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const i = await prisma.itinerary.findFirst({
        where: { destination: { contains: 'Ayodhya' } },
        orderBy: { createdAt: 'desc' },
    })
    console.log(JSON.stringify(i?.itineraryData, null, 2))
}
main()
