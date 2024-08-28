import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';

export const options = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Run simple JS code')
    .addStringOption((s) => s.setName('code').setDescription('JS code').setRequired(true))
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const owner = await interaction.client.users.fetch(config.kony_id);

    if (![config.kony_id, '684472142804549637'].includes(interaction.user.id)) {
        const embed_log_fail_permission = new EmbedBuilder()
            .setTitle('Action: Eval No Permission')
            .setColor('#e32e12')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
        await owner.send({ embeds: [embed_log_fail_permission] });
        return await interaction.reply('Sorry! You dont have permission to perform this action');
    }

    const code = interaction.options.getString('code', true);

    const evaluated = eval(code);
    if (evaluated instanceof Promise) {
        await interaction.reply('💨 Running...');
        return evaluated.then(async (result) => await interaction.editReply(result));
    }

    return await interaction.reply(evaluated);
};
