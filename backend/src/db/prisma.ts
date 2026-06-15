import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { getDatabaseUrl } from '../config/env.js';

const poolMax = Number.parseInt(
  process.env.DATABASE_POOL_MAX ?? '3',
  10,
);

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 3,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});

export const prisma = new PrismaClient({ adapter });

export default prisma;