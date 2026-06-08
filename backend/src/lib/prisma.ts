// backend/src/lib/prisma.ts
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { PrismaClient } from '../generated/prisma/client.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });

export default prisma;
