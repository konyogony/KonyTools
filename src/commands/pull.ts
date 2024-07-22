import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';
import { $ } from 'bun';

export const options = new SlashCommandBuilder().setName('pull').setDescription('Get updates from GitHub').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    try {
        const command =
            await $`git pull https://kony-ogony:${config.github_token}@github.com/kony-ogony/kony_ds_tools.git`.text();

        if (command.includes('Already up to date.')) return await interaction.reply('Already up to date.');

        await interaction.reply(['```', command.replaceAll(config.github_token, 'TOKEN_REDACTED'), '```'].join('\n'));
        setTimeout(() => {
            interaction.client.destroy();
            process.exit();
        }, 1000);

        return;
    } catch (error) {
        console.log(error);
        return await interaction.reply('An error occured, check the console');
    }
};
