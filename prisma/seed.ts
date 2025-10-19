import { PrismaClient, Prisma } from '@prisma/client'
import { getDatabaseConfig } from '../src/lib/db-config'

const prisma = new PrismaClient()
const isPostgres = () => getDatabaseConfig().provider === 'postgresql'

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

  // Create sample notes (provider-aware tags)
  const sampleNoteData: Record<string, unknown> = {
    videoId: 'sample-video-id',
    content: 'This is a sample note for testing purposes.',
    userId: testUser.id,
  }
  sampleNoteData['tags'] = isPostgres() ? ['sample', 'test'] : JSON.stringify(['sample', 'test'])

  const sampleNote = await prisma.note.create({
    data: sampleNoteData as unknown as Prisma.NoteCreateInput,
  })

  console.log('✅ Created sample note:', sampleNote.id)

  // Create sample event log (provider-aware metadata)
  const sampleEventData: Record<string, unknown> = {
    eventType: 'video_viewed',
    entityType: 'video',
    entityId: 'sample-video-id',
    userId: testUser.id,
  }
  sampleEventData['metadata'] = isPostgres() 
    ? { action: 'initial_view' } 
    : JSON.stringify({ action: 'initial_view' })

  const sampleEvent = await prisma.eventLog.create({
    data: sampleEventData as unknown as Prisma.EventLogCreateInput,
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