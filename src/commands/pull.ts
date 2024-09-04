import { $ } from 'bun';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';

export const options = new SlashCommandBuilder().setName('pull').setDescription('Get updates from GitHub').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const owner = await interaction.client.users.fetch(config.kony_id);

    if (![config.kony_id, '684472142804549637'].includes(interaction.user.id)) {
        const embed_log_fail_permission = new EmbedBuilder()
            .setTitle('Action: Pull No Permission')
            .setColor('#e32e12')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
        await owner.send({ embeds: [embed_log_fail_permission] });
        return await interaction.reply('Sorry! You dont have permission to perform this action');
    }

    try {
        const command =
            await $`git pull https://kony-ogony:${config.github_token}@github.com/konyogony/KonyTools.git`.text();

        if (command.includes('Already up to date.')) return await interaction.reply('Already up to date.');

        const embed_log_success = new EmbedBuilder()
            .setTitle('Action: Pull Success')
            .setColor('#4f9400')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
        await owner.send({ embeds: [embed_log_success] });

        await interaction.reply(['```', command.replaceAll(config.github_token, 'TOKEN_REDACTED'), '```'].join('\n'));
        setTimeout(() => {
            interaction.client.destroy();
            process.exit();
        }, 1000);

        return;
    } catch (error) {
        const embed_log_fail_error = new EmbedBuilder()
            .setTitle('Action: Pull Error')
            .setColor('#e32e12')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([
                { name: 'User', value: `<@${interaction.user.id}>` },
                { name: 'Error', value: `${error}` },
            ]);
        await owner.send({ embeds: [embed_log_fail_error] });
        console.log(error);
        return await interaction.reply('An error occured, check the console');
    }
};
