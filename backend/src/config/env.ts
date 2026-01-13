import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file in the backend directory
dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

// Define the environment variables with proper typing
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/rfp_management',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_here',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};

// Validate required environment variables
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

export { env };
