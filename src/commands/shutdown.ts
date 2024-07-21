import path from 'path';
import fs from 'fs';
import { ActivityType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { exec } from 'child_process';
import { client } from '..';
import dayjs from 'dayjs';

export const options = {
    ...new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Set a timer to shutdown')
        .addStringOption((option) =>
            option.setName('time').setDescription('In how many minutes would it shut down').setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName('platform')
                .setDescription('Windows or Linux')
                .setRequired(true)
                .addChoices([
                    { name: 'Windows', value: 'windows' },
                    { name: 'Linux', value: 'linux' },
                ]),
        )
        .toJSON(),
    ...{ integration_types: [1], contexts: [0, 1, 2] },
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const time = interaction.options.getString('time', true);
    const platform = interaction.options.getString('platform', true);

    try {
        const logFilePath = path.join(__dirname, '../command_log.log');
        fs.appendFileSync(
            logFilePath,
            `Username: ${interaction.user.username}, Action: Shutdown, Thailand Time: ${dayjs().format('YYYY-MM-DD HH:mm')}\n`,
            'utf8',
        );
    } catch (e) {
        console.error(e);
    }

    if (interaction.user.id !== '564472732071493633')
        return interaction.reply('Sorry! You dont have permission to perform this action');

    const minutes = parseInt(time);

    if (platform === 'linux') {
        exec(`shutdown -P ${minutes}`);
    } else if (platform === 'windows') {
        exec(`shutdown /s /t ${minutes * 60}`);
    }

    const shutdownTime = Date.now() + minutes * 60000;

    setInterval(() => {
        if (!client.user) return;
        const now = Date.now();
        const timeLeft = shutdownTime - now;
        if (timeLeft <= 0) {
            client.user.setActivity({
                name: 'Shutting down now',
                type: ActivityType.Custom,
                state: '',
            });
            return;
        }
        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
        client.user.setActivity({
            name: `Shutting down in ${minutesLeft}m ${secondsLeft}s`,
            type: ActivityType.Custom,
            state: '',
        });
    }, 5000);

    return interaction.reply(`Shutdown is set for <t:${shutdownTime}:f>`);
};
