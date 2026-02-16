import ru from 'convert-layout/ru';
import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ComponentType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('unwtf_en_to_ru')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

const extractText = (message: MessageContextMenuCommandInteraction['targetMessage']): string => {
    if (message.content) return message.content;

    return message.components
        .flatMap((c) =>
            c.type === ComponentType.TextDisplay
                ? c.data.content
                : c.type === ComponentType.Section
                  ? c.components.filter((i) => i.type === ComponentType.TextDisplay).map((i) => i.data.content)
                  : [],
        )
        .join('\n');
};

export const run = async (interaction: MessageContextMenuCommandInteraction) => {
    const extracted = extractText(interaction.targetMessage);

    if (!extracted) {
        const text = new TextDisplayBuilder().setContent('No text found in message');

        return interaction.reply({
            components: [text],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    }

    const text = new TextDisplayBuilder().setContent(ru.fromEn(extracted));

    return interaction.reply({
        components: [text],
        flags: MessageFlags.IsComponentsV2,
    });
};
