import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';
import { $ } from 'bun';

export const options = new SlashCommandBuilder().setName('pull').setDescription('Get updates from GitHub').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const embed_log = new EmbedBuilder()
        .setTitle('Action: Pull')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
        ]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    if (owner) await owner.send({ embeds: [embed_log] });

    if ([config.kony_id, '684472142804549637'].includes(interaction.user.id))
        return await interaction.reply('Sorry! You dont have permission to perform this action');

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
