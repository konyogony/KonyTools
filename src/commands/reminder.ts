import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { reminderList } from '../reminderList';
import config from '../utils/config';

const timezones = [
    { name: 'Thailand', value: 7 },
    { name: 'Chelyabinsk', value: 5 },
    { name: 'Moscow', value: 3 },
    { name: 'Spain', value: 2 },
];

export const options = new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder')
    .addStringOption((option) => option.setName('reminder').setDescription('Content of the reminder').setRequired(true))
    .addStringOption((option) =>
        option.setName('time').setDescription('Time for the reminder (e.g., 20 July 22:38)').setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName('timezone')
            .setDescription('Timezone for the reminder')
            .setRequired(true)
            .addChoices(
                timezones.map((timezone) => ({
                    name: timezone.name,
                    value: timezone.name,
                })),
            ),
    )
    .addUserOption((option) => option.setName('user').setDescription('User to ping').setRequired(true))
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const reminderContent = interaction.options.getString('reminder', true);
    const reminderTimeStr = interaction.options.getString('time', true).toLowerCase();
    const selectedTimezone = interaction.options.getString('timezone', true);
    const targetUser = interaction.options.getUser('user', true);

    const owner = await interaction.client.users.fetch(config.kony_id);

    const timeFormatRegex = /^\d{1,2} [A-Za-z]+ \d{2}:\d{2}$/;
    if (!timeFormatRegex.test(reminderTimeStr)) {
        const embed_log_fail_format = new EmbedBuilder()
            .setTitle('Action: Reminder Invalid Time')
            .setColor('#e32e12')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([
                { name: 'User', value: `<@${interaction.user.id}>` },
                { name: 'Reminder Content', value: reminderContent },
                { name: 'Reminder Time', value: reminderTimeStr },
                { name: 'Reminder Timezone', value: `${selectedTimezone}` },
                { name: 'Reminder mention', value: `<@${targetUser.id}>` },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
            ]);
        if (owner) await owner.send({ embeds: [embed_log_fail_format] });
        return await interaction.reply({
            content: 'Invalid time format. Please use the format "DD MMM HH:mm" (e.g., "20 July 22:38").',
            ephemeral: true,
        });
    }
    const utcNow = new Date().getTime();

    const [day, monthName, time] = reminderTimeStr.split(' ');
    const [hours, minutes] = time.split(':');

    const monthMap: { [key: string]: number } = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
    };

    const month = monthMap[monthName];

    const timezone = timezones.find((tz) => tz.name === selectedTimezone);
    const offset = timezone ? timezone.value : 0;

    const localDate = new Date(
        Date.UTC(2024, month, parseInt(day, 10), parseInt(hours, 10) - offset, parseInt(minutes, 10)),
    );

    const utcReminder = localDate.getTime();
    const delay = utcReminder - utcNow;

    if (delay < 0) {
        const embed_log_fail_past = new EmbedBuilder()
            .setTitle('Action: Reminder in the past')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor('#e32e12')
            .setFields([
                { name: 'User', value: `<@${interaction.user.id}>` },
                { name: 'utcReminder', value: `${utcReminder}` },
                { name: 'utcNow', value: `${utcNow}` },
                { name: 'delay', value: `${delay}` },
                { name: 'Reminder Content', value: reminderContent },
                { name: 'Reminder Time', value: reminderTimeStr },
                { name: 'Reminder Timezone', value: `${selectedTimezone}` },
                { name: 'Reminder mention', value: `<@${targetUser.id}>` },
                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
            ]);
        if (owner) await owner.send({ embeds: [embed_log_fail_past] });
        return await interaction.reply({
            content: 'The reminder time is in the past. Please set a future time.',
            ephemeral: true,
        });
    }
    const reminderToPush = {
        interaction_user_id: interaction.user.id,
        interaction_user_img: interaction.user.displayAvatarURL(),
        content: reminderContent,
        time: utcReminder,
        timezone: selectedTimezone,
        user_mention_id: targetUser.id,
    };

    reminderList.push(reminderToPush);

    setTimeout(async () => {
        try {
            const embed_log_success_send = new EmbedBuilder()
                .setTitle('Action: Reminder Sent')
                .setColor('#4f9400')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Reminder Content', value: reminderContent },
                    { name: 'Reminder Time', value: reminderTimeStr },
                    { name: 'Reminder Timezone', value: `${selectedTimezone}` },
                    { name: 'Reminder mention', value: `<@${targetUser.id}>` },
                    { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
                ]);
            if (owner) await owner.send({ embeds: [embed_log_success_send] });

            const reminderIndex = reminderList.findIndex((reminderFound) => reminderToPush === reminderFound);
            if (reminderIndex !== -1) reminderList.splice(reminderIndex, 1);

            const embed_success_send = new EmbedBuilder()
                .setTitle(`${reminderContent.slice(0, 20)}${reminderContent.length > 20 ? '...' : ''}`)
                .setDescription(`<@${targetUser.id}>, your reminder, \n \`\`\`${reminderContent}\`\`\``);
            return await interaction.followUp({ embeds: [embed_success_send] });
        } catch (e) {
            const embed_log_fail_send = new EmbedBuilder()
                .setTitle('Action: Reminder Sent Failure')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor('#e32e12')
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Reminder Content', value: reminderContent },
                    { name: 'Reminder Time', value: reminderTimeStr },
                    { name: 'Reminder Timezone', value: `${selectedTimezone}` },
                    { name: 'Reminder mention', value: `<@${targetUser.id}>` },
                    { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
                    { name: 'Error', value: `${e}` },
                ]);
            if (owner) await owner.send({ embeds: [embed_log_fail_send] });
        }
    }, delay);

    const embed_log_success_create = new EmbedBuilder()
        .setTitle('Action: Reminder Created')
        .setColor('#4f9400')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            { name: 'Reminder Content', value: reminderContent },
            { name: 'Reminder Time', value: reminderTimeStr },
            { name: 'Reminder Timezone', value: `${selectedTimezone}` },
            { name: 'Reminder mention', value: `<@${targetUser.id}>` },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
        ]);
    if (owner) await owner.send({ embeds: [embed_log_success_create] });

    const embed_success_create = new EmbedBuilder()
        .setTitle('Reminder created')
        .setColor('#4f9400')
        .addFields(
            { name: 'Content', value: reminderContent },
            { name: 'Time', value: `<t:${Math.floor(utcReminder / 1000)}:f>` },
            { name: 'User to ping', value: `<@${targetUser.id}>` },
        );

    return await interaction.reply({
        embeds: [embed_success_create],
    });
};
