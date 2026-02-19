import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/database/schema.ts',
    out: '.drizzle/',

    dbCredentials: {
        url: process.env.STATE_DIRECTORY ? `${process.env.STATE_DIRECTORY}/database.sqlite` : 'database.sqlite',
    },
});
