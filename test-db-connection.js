#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Run this script to test your PostgreSQL database connection
 * 
 * Usage: node test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test database info
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('🗄️  Database version:', result[0].version);
    
    console.log('\n🎉 Database is ready for use!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Check your DATABASE_URL in .env file');
      console.log('   - Ensure database server is running');
      console.log('   - Verify network connectivity');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication issue:');
      console.log('   - Check username and password in DATABASE_URL');
      console.log('   - Verify database user permissions');
    }
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 Database does not exist:');
      console.log('   - Create the database first');
      console.log('   - Run: npx prisma db push');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });