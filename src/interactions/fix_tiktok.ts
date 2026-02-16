import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('fix_tiktok')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: MessageContextMenuCommandInteraction) => {
    const text = new TextDisplayBuilder().setContent(
        interaction.targetMessage.content.replace(/https?:\/\/([a-z0-9-]+\.)*tiktok\.com/gi, (match) =>
            match.replace(/tiktok\.com/i, 'tnktok.com'),
        ),
    );

    return interaction.reply({
        components: [text],
        flags: MessageFlags.IsComponentsV2,
    });
};
