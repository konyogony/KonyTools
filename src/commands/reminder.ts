import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { Reminder, ReminderSchema } from '../database';
import config from '../utils/config';

const timezones = [
    { name: 'Moscow', value: 'Europe/Moscow' },
    { name: 'Chelyabinsk', value: 'Asia/Yekaterinburg' },
    { name: 'Thailand', value: 'Asia/Bangkok' },
];

export const options = new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Reminder')
    .addSubcommand((sc) =>
        sc
            .setName('create')
            .setDescription('Create a reminder')
            .addStringOption((s) => s.setName('content').setDescription('Content of the reminder').setRequired(true))
            .addStringOption((s) =>
                s.setName('time').setDescription(`Time for the reminder (e.g. 2024/09/11 16:14)`).setRequired(true),
            )
            .addStringOption((s) =>
                s
                    .setName('timezone')
                    .setDescription('Timezone for the reminder')
                    .setRequired(true)
                    .addChoices(
                        timezones.map((timezone) => ({
                            name: timezone.name,
                            value: timezone.name,
                        })),
                    ),
            ),
    )
    .addSubcommand((sc) => sc.setName('view').setDescription('View all reminders'))
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const owner = await interaction.client.users.fetch(config.kony_id);

    switch (interaction.options.getSubcommand()) {
        case 'create': {
            const content = interaction.options.getString('content', true);
            const time = interaction.options.getString('time', true).toLowerCase();
            const timezone = interaction.options.getString('timezone', true);
            const regex =
                /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01]) (00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9])$/;

            const embed_log = new EmbedBuilder()
                .setTitle('Action: Reminder Create')
                .setColor('Yellow')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Content', value: content },
                    { name: 'Time', value: time, inline: true },
                    { name: 'Timezone', value: timezone, inline: true },
                ]);
            await owner.send({ embeds: [embed_log] });

            if (!regex.test(time))
                return await interaction.reply({
                    content: `Invalid time format. Please use the format "YYYY/MM/DD HH:mm" (e.g. 2024/09/11 16:14).`,
                    ephemeral: true,
                });

            process.env['TZ'] = timezones.find(({ name }) => name === timezone)!.value;

            const [datePart, timePart] = time.split(' ');
            const [year, month, day] = datePart.split('/').map(Number);
            const [hours, minutes] = timePart.split(':').map(Number);

            const reminderTime = Math.floor(new Date(year, month - 1, day, hours, minutes).getTime() / 1000 / 60);

            if (Math.floor(new Date().getTime() / 1000 / 60) > reminderTime)
                return await interaction.reply({
                    content: 'The reminder time is in the past. Please set a future time.',
                    ephemeral: true,
                });

            await Reminder.create({
                user_id: interaction.user.id,
                content,
                time: reminderTime,
                time_created: Date.now(),
            } as ReminderSchema);

            const embed_success_create = new EmbedBuilder()
                .setTitle('Reminder created')
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setFields([
                    { name: 'Content', value: content },
                    { name: 'Time', value: `<t:${reminderTime * 60}:f>` },
                ]);

            return await interaction.reply({ embeds: [embed_success_create] });
        }

        case 'view': {
            const reminders = await Reminder.find();

            if (reminders.length === 0) return await interaction.reply('No reminders found.');

            let activeIndex = 0;
            let reminder = reminders[activeIndex];
            if (!reminder) return;

            const removeButton = new ButtonBuilder().setCustomId('remove').setLabel('🗑️').setStyle(ButtonStyle.Danger);
            const leftButton = new ButtonBuilder().setCustomId('left').setLabel('⬅️').setStyle(ButtonStyle.Secondary);
            const rightButton = new ButtonBuilder().setCustomId('right').setLabel('➡️').setStyle(ButtonStyle.Secondary);
            const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
                leftButton,
                removeButton,
                rightButton,
            );

            const generateEmbed = async (reminder: ReminderSchema) => {
                const user = await interaction.client.users.fetch(reminder.user_id);

                return new EmbedBuilder()
                    .setTitle(reminder.content.slice(0, 40) + (reminder.content.length > 40 ? '...' : ''))
                    .setFields([
                        { name: 'Author', value: `<@${user.id}>`, inline: true },
                        { name: 'Time', value: `<t:${reminder.time * 60}:f>`, inline: true },
                        { name: 'Content', value: ['```', reminder.content, '```'].join('') },
                    ])
                    .setThumbnail(user.displayAvatarURL())
                    .setTimestamp(reminder.time_created);
            };

            const reply = await interaction.reply({
                ...(reminders.length > 1 && { content: `Page ${activeIndex + 1} of ${reminders.length}` }),
                embeds: [await generateEmbed(reminder)],
                ...(reminders.length > 1
                    ? { components: [components] }
                    : { components: [new ActionRowBuilder<ButtonBuilder>().addComponents(removeButton)] }),
                fetchReply: true,
            });

            const embed_log_success = new EmbedBuilder()
                .setTitle(`Action: Reminder Show Success`)
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: `Reminder count`, value: `${reminders.length}` },
                ]);
            await owner.send({ embeds: [embed_log_success] });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120000,
            });

            collector.on('collect', async (i) => {
                switch (i.customId) {
                    case 'remove': {
                        if (!reminder) return;

                        if (reminder.user_id === i.user.id) {
                            if (!(await Reminder.findById(reminder as ReminderSchema)))
                                return await i.reply({ content: "This reminder doesn't exist", ephemeral: true });

                            await Reminder.deleteOne(reminder as ReminderSchema);
                            await i.reply({ content: 'Reminder deleted', ephemeral: true });

                            const embed_log_success = new EmbedBuilder()
                                .setTitle(`Action: Reminder Remove Success`)
                                .setColor('#4f9400')
                                .setTimestamp(new Date())
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'Author', value: `<@${interaction.user.id}>`, inline: true },
                                    { name: 'Time', value: `<t:${reminder.time * 60}:f>`, inline: true },
                                    { name: 'Reminder Content', value: reminder.content },
                                ]);

                            await owner.send({ embeds: [embed_log_success] });

                            if (activeIndex >= reminders.length) activeIndex = reminders.length - 1;
                            reminder = reminders[activeIndex];
                        } else {
                            const embed_log_fail = new EmbedBuilder()
                                .setTitle(`Action: Reminder Remove No Permission`)
                                .setColor('#e32e12')
                                .setTimestamp(new Date())
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'Author', value: `<@${reminder.user_id}>`, inline: true },
                                    { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
                                    { name: 'Time', value: `<t:${reminder.time * 60}:f>`, inline: true },
                                    { name: 'Reminder Content', value: reminder.content },
                                ]);
                            await owner.send({ embeds: [embed_log_fail] });
                            await i.reply({ content: 'You are not the author of this reminder', ephemeral: true });
                        }
                        break;
                    }
                    case 'left':
                    case 'right': {
                        activeIndex =
                            i.customId === 'left'
                                ? activeIndex === 0
                                    ? reminders.length - 1
                                    : activeIndex - 1
                                : activeIndex === reminders.length - 1
                                  ? 0
                                  : activeIndex + 1;
                        reminder = reminders[activeIndex];

                        if (!reminder) return;
                        await i.update({
                            ...(reminders.length > 1 && { content: `Page ${activeIndex + 1} of ${reminders.length}` }),
                            embeds: [await generateEmbed(reminder)],
                            ...(reminders.length > 1
                                ? { components: [components] }
                                : { components: [new ActionRowBuilder<ButtonBuilder>().addComponents(removeButton)] }),
                        });
                        break;
                    }
                }

                return;
            });

            collector.on('end', (_, reason) => reason === 'time' && interaction.editReply({ components: [] }));
            return;
        }
    }

    return;
};
