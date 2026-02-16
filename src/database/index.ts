import { join } from 'node:path';
import Bun from 'bun';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '@/database/schema';

export const database = drizzle(
    Bun.env.STATE_DIRECTORY ? join(Bun.env.STATE_DIRECTORY, 'database.sqlite') : 'database.sqlite',
    { schema: { ...schema } },
);
