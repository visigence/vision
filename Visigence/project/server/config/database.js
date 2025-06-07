import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Create the SQL client with the provided Neon DB connection
export const sql = neon('postgresql://NeonDB-Web_owner:npg_uh03iKkjwJaB@ep-quiet-poetry-a9uk0mxu-pooler.gwc.azure.neon.tech/NeonDB-Web?sslmode=require');

// Test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    console.log('✅ Database connected successfully');
    console.log('📊 PostgreSQL version:', result[0].version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Execute raw SQL queries with error handling
export async function executeQuery(query, params = []) {
  try {
    const result = await sql(query, ...params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
}