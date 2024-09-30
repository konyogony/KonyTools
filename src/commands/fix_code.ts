import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('fix_code')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;
    const message = ['```', interaction.targetMessage.content, '```'].join('');
    return await interaction.reply(message);
};
