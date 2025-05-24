import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Neon requires SSL
  max: 10, // Lower pool size for serverless
  idleTimeoutMillis: 10000, // Shorter idle timeout for Neon
  connectionTimeoutMillis: 3000,
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Try to enable PostGIS extension if it’s not already installed
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension ensured.');

    // Test PostGIS extension
    const result = await client.query('SELECT PostGIS_Version()');
    console.log('PostGIS version:', result.rows[0]?.postgis_version);
    
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};