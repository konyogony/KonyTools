import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('fix_tiktok')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;
    return await interaction.reply(interaction.targetMessage.content.replace('tiktok', 'tnktok'));
};
