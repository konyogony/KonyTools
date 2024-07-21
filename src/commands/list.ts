import dayjs from 'dayjs';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export const options = {
    ...new SlashCommandBuilder().setName('list').setDescription('List all active reminders').toJSON(),
    integration_types: [1],
    contexts: [0, 1, 2],
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    try {
        const logFilePath = path.join(__dirname, '../command_log.log');
        fs.appendFileSync(
            logFilePath,
            `Username: ${interaction.user.username}, Action: List,Thailand Time: ${dayjs().format('YYYY-MM-DD HH:mm')}\n`,
            'utf8',
        );
    } catch (e) {
        console.error(e);
    }
    return interaction.reply('');
};
