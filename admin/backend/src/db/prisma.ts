import { PrismaClient } from '../generated/prisma/client.js';
import { getDatabaseUrl } from '../config/env.js';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

export default prisma;
