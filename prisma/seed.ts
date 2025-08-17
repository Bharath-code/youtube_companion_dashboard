import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Create a test user (for development only)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://via.placeholder.com/150',
    },
  })

  console.log('✅ Created test user:', testUser.email)

  // Create sample notes
  const sampleNote = await prisma.note.create({
    data: {
      videoId: 'sample-video-id',
      content: 'This is a sample note for testing purposes.',
      tags: JSON.stringify(['sample', 'test']),
      userId: testUser.id,
    },
  })

  console.log('✅ Created sample note:', sampleNote.id)

  // Create sample event log
  const sampleEvent = await prisma.eventLog.create({
    data: {
      eventType: 'video_viewed',
      entityType: 'video',
      entityId: 'sample-video-id',
      metadata: JSON.stringify({ action: 'initial_view' }),
      userId: testUser.id,
    },
  })

  console.log('✅ Created sample event log:', sampleEvent.id)
  console.log('🎉 Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })