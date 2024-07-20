import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const timezones = [
    { name: 'Thailand', value: 7 },
    { name: 'Chelyabinsk', value: 5 },
    { name: 'Moscow', value: 3 },
    { name: 'Spain', value: 2 },
];

export const options = {
    ...new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder')
        .addStringOption((option) =>
            option.setName('reminder').setDescription('Content of the reminder').setRequired(true),
        )
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
        .toJSON(),
    integration_types: [1],
    contexts: [0, 1, 2],
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const reminderContent = interaction.options.getString('reminder', true);
    const reminderTimeStr = interaction.options.getString('time', true);
    const selectedTimezone = interaction.options.getString('timezone', true);

    const timeFormatRegex = /^\d{1,2} [A-Za-z]+ \d{2}:\d{2}$/;
    if (!timeFormatRegex.test(reminderTimeStr)) {
        return interaction.reply('Invalid time format. Please use the format "DD MMM HH:mm" (e.g., "20 July 22:38").');
    }
    const utcNow = new Date().getTime();

    const [day, monthName, time] = reminderTimeStr.split(' ');
    const [hours, minutes] = time.split(':');

    const monthMap: { [key: string]: number } = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
    };

    const month = monthMap[monthName];

    const timezone = timezones.find((tz) => tz.name === selectedTimezone);
    const offset = timezone ? timezone.value : 0;

    const localDate = new Date(
        Date.UTC(2024, month, parseInt(day, 10), parseInt(hours, 10) - offset, parseInt(minutes, 10)),
    );

    const utcReminder = localDate.getTime();

    const delay = utcReminder - utcNow;

    const thailandTimeOffset = 7;
    const thailandTime = new Date(utcNow + thailandTimeOffset * 60 * 60 * 1000).toLocaleString('en-US', {
        timeZone: 'Asia/Bangkok',
    });

    const logEntry = `Username: ${interaction.user.username}, Action: Reminder, Reminder: ${reminderContent}, Time: ${reminderTimeStr}, Timezone: ${selectedTimezone}, Thailand Time: ${thailandTime}\n`;

    try {
        const logFilePath = path.join(__dirname, '../command_log.txt');
        fs.appendFileSync(logFilePath, logEntry, 'utf8');
    } catch (e) {
        console.error(e);
    }

    if (delay < 0) {
        return interaction.reply('The reminder time is in the past. Please set a future time.');
    }

    setTimeout(() => {
        interaction.followUp(`<@${interaction.user.id}>, your reminder \`${reminderContent}\``);
    }, delay);

    return interaction.reply(
        `Reminder set for \`${reminderContent}\` at \`${reminderTimeStr}\` ${selectedTimezone} time.`,
    );
};
