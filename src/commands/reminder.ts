import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

dayjs.extend(utc);
dayjs.extend(timezone);

interface IReminder {
    content: string;
    time: Date;
}

const reminders: IReminder[] = [];

const timezones = ['Thailand', 'Chelyabinsk', 'Moscow', 'Spain'];

export const options = {
    ...new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder')
        .addStringOption((option) =>
            option.setName('reminder').setDescription('Content of the reminder').setRequired(true),
        )
        .addStringOption((option) =>
            option.setName('time').setDescription('Time for the reminder (e.g., 18 July 00:00)').setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('timezone')
                .setDescription('Timezone for the reminder')
                .setRequired(true)
                .addChoices(
                    timezones.map((timezone) => ({
                        name: timezone,
                        value: timezone,
                    })),
                ),
        )
        .toJSON(),
    integration_types: [1],
    contexts: [0, 1, 2],
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const reminderContent = interaction.options.getString('reminder', true);
    const reminderTimeStr = interaction.options.getString('time', true);
    const selectedTimezone = interaction.options.getString('timezone', true);

    let timezoneIdentifier: string | undefined;

    switch (selectedTimezone) {
        case 'Thailand':
            timezoneIdentifier = 'Asia/Bangkok';
            break;
        case 'Chelyabinsk':
            timezoneIdentifier = 'Asia/Yekaterinburg';
            break;
        case 'Moscow':
            timezoneIdentifier = 'Europe/Moscow';
            break;
        case 'Spain':
            timezoneIdentifier = 'Europe/Madrid';
            break;
        default:
            await interaction.reply('Invalid timezone selected.');
            return;
    }

    const reminderTime = dayjs.tz(reminderTimeStr, 'DD MMMM HH:mm');

    if (!reminderTime.isValid()) {
        return interaction.reply('Invalid time format. Please use a valid date and time format.');
    }

    const currentTime = dayjs().tz(timezoneIdentifier);
    console.log('Current Time:', currentTime.format('YYYY-MM-DD HH:mm:ss'));
    console.log('Reminder Time:', reminderTime.format('YYYY-MM-DD HH:mm:ss'));

    if (reminderTime.isBefore(currentTime)) {
        await interaction.reply('Reminder time cannot be in the past. Please provide a future time.');
        return;
    }

    reminders.push({ content: reminderContent, time: reminderTime.toDate() });
    await interaction.reply(
        `Reminder \`${reminderContent}\` is set for <t:${reminderTime.unix()}:f> in ${selectedTimezone}`,
    );

    const delay = reminderTime.diff(currentTime, 'millisecond');

    setTimeout(() => {
        interaction.followUp(`<@${interaction.user.id}>, your reminder \`${reminderContent}\``);
        const index = reminders.findIndex((r) => r.content === reminderContent);
        if (index !== -1) {
            reminders.splice(index, 1);
        }
    }, delay);
};
