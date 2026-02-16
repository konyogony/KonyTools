import { $ } from 'bun';
import {
    ApplicationIntegrationType,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    TextDisplayBuilder,
} from 'discord.js';

export const options = new SlashCommandBuilder()
    .setName('exec')
    .setDescription('Execute shell command')
    .addStringOption((option) => option.setName('command').setDescription('The command to execute').setRequired(true))
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (interaction.user.id !== '684472142804549637') {
        const unauthorized = new TextDisplayBuilder().setContent('You are not allowed to use this command');

        return interaction.reply({
            components: [unauthorized],
            flags:
                (interaction.context !== InteractionContextType.BotDM ? MessageFlags.Ephemeral : 0) |
                MessageFlags.IsComponentsV2,
        });
    }

    const command = interaction.options.getString('command', true);

    await interaction.deferReply();

    let output: string;
    try {
        const result = await $`${{ raw: command }}`.quiet();
        output = result.text() || '(no output)';
    } catch (err) {
        if (err instanceof $.ShellError) {
            output = err.stderr.toString() || err.stdout.toString() || err.message;
        } else {
            output = String(err);
        }
    }

    if (output.length <= 1900) {
        const text = new TextDisplayBuilder().setContent(`\`\`\`\n${output}\n\`\`\``);

        return interaction.editReply({
            components: [text],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    const attachment = new AttachmentBuilder(Buffer.from(output, 'utf-8'), { name: 'output.txt' });

    return interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        files: [attachment],
    });
};
