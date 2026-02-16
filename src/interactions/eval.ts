import Bun from 'bun';
import consola from 'consola';
import {
    ApplicationIntegrationType,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import { admins } from '@/utils';

export const options = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluate JavaScript')
    .addStringOption((option) => option.setName('code').setDescription('The code to evaluate').setRequired(true))
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (!Object.values(admins).includes(interaction.user.id)) {
        const unauthorized = new TextDisplayBuilder().setContent('You are not allowed to use this command');

        return interaction.reply({
            components: [unauthorized],
            flags:
                (interaction.context !== InteractionContextType.BotDM ? MessageFlags.Ephemeral : 0) |
                MessageFlags.IsComponentsV2,
        });
    }

    const code = interaction.options.getString('code', true);
    consola.info(`eval: ${interaction.user.tag} evaluating code`);

    try {
        const start = Date.now();
        // biome-ignore lint/security/noGlobalEval: admin only
        let result = eval(code);

        if (result instanceof Promise) {
            await interaction.deferReply();
            result = await result;
            const time = Date.now() - start;
            return sendResult(interaction, result, time, true);
        }

        const time = Date.now() - start;
        return sendResult(interaction, result, time, true);
    } catch (err) {
        consola.error(`eval: ${err}`);
        return sendResult(interaction, err, null, false);
    }
};

const sendResult = async (
    interaction: ChatInputCommandInteraction,
    result: unknown,
    time: number | null,
    success: boolean,
) => {
    const inspected = Bun.inspect(result, { depth: 10 });
    const status = success ? '✅ Evaluated successfully' : '❌ Evaluation failed';
    const timing = time !== null ? ` in ${time}ms` : '';

    if (inspected.length <= 1900) {
        const text = new TextDisplayBuilder().setContent(`${status}${timing}:\n\`\`\`\n${inspected}\n\`\`\``);

        if (interaction.deferred) {
            return interaction.editReply({
                components: [text],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        return interaction.reply({
            components: [text],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    const fullInspected = Bun.inspect(result, { depth: Infinity });
    const attachment = new AttachmentBuilder(Buffer.from(fullInspected, 'utf-8'), { name: 'result.txt' });
    const text = new TextDisplayBuilder().setContent(`${status}${timing}`);

    if (interaction.deferred) {
        return interaction.editReply({
            components: [text],
            flags: MessageFlags.IsComponentsV2,
            files: [attachment],
        });
    }

    return interaction.reply({
        components: [text],
        flags: MessageFlags.IsComponentsV2,
        files: [attachment],
    });
};
