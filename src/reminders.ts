import Bun from 'bun';
import { getUnixTime } from 'date-fns';
import { MessageFlags, REST, Routes, SeparatorBuilder, Snowflake, TextDisplayBuilder } from 'discord.js';
import { eq, lte } from 'drizzle-orm';
import { database } from '@/database';
import { reminders } from '@/database/schema';

if (!Bun.env.DISCORD_TOKEN) process.exit(0);

const rest = new REST().setToken(Bun.env.DISCORD_TOKEN);

const due = await database
    .select()
    .from(reminders)
    .where(lte(reminders.time, Math.floor(getUnixTime(new Date()) / 60)));

if (due.length === 0) process.exit();

await Promise.all(
    due.map(async (reminder) => {
        const channel = (await rest.post(Routes.userChannels(), {
            body: {
                recipient_id: reminder.user,
            },
        })) as { id: Snowflake };

        const components = [
            new TextDisplayBuilder().setContent('## Reminder'),
            new SeparatorBuilder(),
            new TextDisplayBuilder().setContent(
                [`## Time`, `<t:${reminder.time * 60}:f>`, `## Content`, reminder.content].join('\n'),
            ),
        ].map((c) => c.toJSON());

        await rest.post(Routes.channelMessages(channel.id), {
            body: {
                components,
                flags: MessageFlags.IsComponentsV2,
            },
        });

        await database.delete(reminders).where(eq(reminders.id, reminder.id));
    }),
);
