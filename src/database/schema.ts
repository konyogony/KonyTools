import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const reminders = sqliteTable('reminders', {
    id: integer().primaryKey({ autoIncrement: true }),
    user: text().notNull(),
    content: text().notNull(),
    time: integer().notNull(),
    createdAt: integer({ mode: 'timestamp_ms' })
        .notNull()
        .$defaultFn(() => new Date()),
});
