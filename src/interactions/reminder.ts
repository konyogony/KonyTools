import consola from 'consola';
import { getUnixTime, isPast, isValid, parseISO } from 'date-fns';
import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SlashCommandBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
} from 'discord.js';
import { eq } from 'drizzle-orm';
import { database } from '@/database';
import { reminders } from '@/database/schema';
import { createPagination } from '@/utils';

export const options = new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Reminder')
    .addSubcommand((sc) =>
        sc
            .setName('create')
            .setDescription('Create a reminder')
            .addStringOption((s) => s.setName('content').setDescription('Content of the reminder').setRequired(true))
            .addStringOption((s) =>
                s
                    .setName('time')
                    .setDescription('Time for the reminder (UTC+3) (e.g. 2026/09/11 16:14)')
                    .setRequired(true),
            ),
    )
    .addSubcommand((sc) => sc.setName('view').setDescription('View all reminders'))
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'create': {
            const content = interaction.options.getString('content', true);
            const timeString = interaction.options.getString('time', true);

            const regex =
                /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01]) (00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9])$/;

            if (!regex.test(timeString)) {
                const text = new TextDisplayBuilder().setContent(
                    'Invalid time format. Please use the format "YYYY/MM/DD HH:mm" (e.g. 2024/09/11 16:14).',
                );
                return interaction.reply({
                    components: [text],
                    flags: MessageFlags.IsComponentsV2,
                    ephemeral: true,
                });
            }

            const [datePart, timePart] = timeString.split(' ');
            const formattedISO = `${datePart.replaceAll('/', '-')}T${timePart}:00+03:00`;
            const date = parseISO(formattedISO);

            if (!isValid(date)) {
                const text = new TextDisplayBuilder().setContent('Invalid date. Please check the date and time.');
                return interaction.reply({
                    components: [text],
                    flags: MessageFlags.IsComponentsV2,
                    ephemeral: true,
                });
            }

            if (isPast(date)) {
                const text = new TextDisplayBuilder().setContent(
                    'The reminder time is in the past. Please set a future time.',
                );
                return interaction.reply({
                    components: [text],
                    flags: MessageFlags.IsComponentsV2,
                    ephemeral: true,
                });
            }

            const reminderTime = Math.floor(getUnixTime(date) / 60);

            await database.insert(reminders).values({
                user: interaction.user.id,
                content,
                time: reminderTime,
            });

            consola.info(`reminder create: ${interaction.user.tag} created a reminder`);

            const text = new TextDisplayBuilder().setContent(`Reminder created\nTime: <t:${reminderTime * 60}:f>`);

            return interaction.reply({
                components: [text],
                flags: MessageFlags.IsComponentsV2,
            });
        }
        case 'view': {
            const allReminders = await database.select().from(reminders);
            consola.info(`reminder view: ${interaction.user.tag} viewing ${allReminders.length} reminders`);

            return createPagination({
                interaction,
                items: allReminders,
                emptyMessage: 'No reminders found',
                generateComponents: async (reminder, _index, _total) => {
                    const user = await interaction.client.users.fetch(reminder.user);

                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                [
                                    '## Author',
                                    `${user.displayName} (${user.id})`,
                                    `## Time`,
                                    `<t:${reminder.time * 60}:f>`,
                                    `## Content`,
                                    reminder.content,
                                ].join('\n'),
                            ),
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL()));

                    return [section, new SeparatorBuilder()];
                },
                generateFooter: async (_reminder, index, total) => {
                    const components: TextDisplayBuilder[] = [];
                    if (total > 1) {
                        const footer = new TextDisplayBuilder().setContent(`-# Reminder ${index + 1} of ${total}`);
                        components.push(footer);
                    }

                    return components;
                },
                onDelete: async (reminder, _index, buttonInteraction) => {
                    if (reminder.user !== buttonInteraction.user.id) {
                        const text = new TextDisplayBuilder().setContent('You are not the author of this reminder');
                        await buttonInteraction.reply({
                            components: [text],
                            flags: MessageFlags.IsComponentsV2,
                            ephemeral: true,
                        });
                        return false;
                    }

                    const exists = await database.select().from(reminders).where(eq(reminders.id, reminder.id));
                    if (exists.length === 0) {
                        const text = new TextDisplayBuilder().setContent("This reminder doesn't exist");
                        await buttonInteraction.reply({
                            components: [text],
                            flags: MessageFlags.IsComponentsV2,
                            ephemeral: true,
                        });
                        return false;
                    }

                    await database.delete(reminders).where(eq(reminders.id, reminder.id));
                    const text = new TextDisplayBuilder().setContent('Reminder deleted');
                    await buttonInteraction.reply({
                        components: [text],
                        flags: MessageFlags.IsComponentsV2,
                        ephemeral: true,
                    });
                    consola.info(`reminder delete: ${buttonInteraction.user.tag} deleted reminder ${reminder.id}`);
                    return true;
                },
            });
        }
        default:
            return;
    }
};
