import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    MessageComponentInteraction,
    MessageCreateOptions,
    MessageFlags,
    Snowflake,
    TextDisplayBuilder,
} from 'discord.js';

interface PaginationOptions<T> {
    interaction: ChatInputCommandInteraction;
    items: T[];
    generateComponents: (
        item: T,
        index: number,
        total: number,
    ) => Promise<NonNullable<MessageCreateOptions['components']>>;
    generateFooter?: (
        item: T,
        index: number,
        total: number,
    ) => Promise<NonNullable<MessageCreateOptions['components']>>;
    onDelete?: (item: T, index: number, buttonInteraction: ButtonInteraction) => Promise<boolean>;
    emptyMessage?: string;
    timeout?: number;
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const admins: Record<string, Snowflake> = {
    kony: '564472732071493633',
    padow: '684472142804549637',
    flop4ik: '544501814255550485',
};

const createPagination = async <T>({
    interaction,
    items,
    generateComponents,
    onDelete,
    generateFooter,
    emptyMessage = 'No items found',
    timeout = 120000,
}: PaginationOptions<T>): Promise<void> => {
    if (items.length === 0) {
        const text = new TextDisplayBuilder().setContent(emptyMessage);
        await interaction.reply({
            components: [text],
            flags: MessageFlags.IsComponentsV2,
        });
        return;
    }

    let activeIndex = 0;

    const left = new ButtonBuilder().setCustomId('left').setLabel('⬅️').setStyle(ButtonStyle.Secondary);
    const remove = new ButtonBuilder().setCustomId('remove').setLabel('🗑️').setStyle(ButtonStyle.Danger);
    const right = new ButtonBuilder().setCustomId('right').setLabel('➡️').setStyle(ButtonStyle.Secondary);

    const getButtons = () => {
        const row = new ActionRowBuilder<ButtonBuilder>();
        if (items.length > 1) row.addComponents(left);
        if (onDelete) row.addComponents(remove);
        if (items.length > 1) row.addComponents(right);

        return row.components.length > 0 ? [row] : [];
    };

    const reply = await interaction.reply({
        components: [
            ...(await generateComponents(items[activeIndex], activeIndex, items.length)),
            ...getButtons(),
            ...(generateFooter ? await generateFooter(items[activeIndex], activeIndex, items.length) : []),
        ],
        flags: MessageFlags.IsComponentsV2,
        withResponse: true,
    });

    const collector = reply.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: timeout,
    });

    collector?.on('collect', async (i: MessageComponentInteraction) => {
        if (!i.isButton()) return;

        switch (i.customId) {
            case 'remove': {
                if (!onDelete) return;

                const deleted = await onDelete(items[activeIndex], activeIndex, i);
                if (!deleted) return;

                items.splice(activeIndex, 1);
                if (activeIndex >= items.length) activeIndex = items.length - 1;

                if (items.length === 0) {
                    const text = new TextDisplayBuilder().setContent(emptyMessage);
                    await interaction.editReply({ components: [text] });
                    collector.stop();
                    return;
                }

                await interaction.editReply({
                    components: [
                        ...(await generateComponents(items[activeIndex], activeIndex, items.length)),
                        ...getButtons(),
                    ],
                });
                break;
            }
            case 'left':
            case 'right': {
                activeIndex =
                    i.customId === 'left'
                        ? activeIndex === 0
                            ? items.length - 1
                            : activeIndex - 1
                        : activeIndex === items.length - 1
                          ? 0
                          : activeIndex + 1;

                await i.update({
                    components: [
                        ...(await generateComponents(items[activeIndex], activeIndex, items.length)),
                        ...getButtons(),
                    ],
                });
                break;
            }
        }
    });

    collector?.on('end', async (_, reason) => {
        if (reason === 'time') {
            const currentComponents = await generateComponents(items[activeIndex], activeIndex, items.length);
            interaction.editReply({ components: currentComponents }).catch(() => null);
        }
    });
};

const parseError = (raw: string): string => {
    try {
        const parsed = JSON.parse(raw);
        const error = parsed?.error ?? parsed;
        if (error?.status && error?.code) return `${error.status} (${error.code})`;
    } catch {
        // NO-OP
    }

    return raw;
};

export { capitalize, admins, createPagination, parseError };
