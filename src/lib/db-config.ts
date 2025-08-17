/**
 * Database configuration utility
 * Handles switching between SQLite (development) and PostgreSQL (production)
 */

export const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    provider: isProduction ? 'postgresql' : 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
    schemaFile: isProduction ? 'schema.production.prisma' : 'schema.prisma'
  }
}

export const getSchemaPath = () => {
  const config = getDatabaseConfig()
  return `prisma/${config.schemaFile}`
}