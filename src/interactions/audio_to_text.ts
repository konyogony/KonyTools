import Bun from 'bun';
import consola from 'consola';
import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    TextDisplayBuilder,
} from 'discord.js';
import ky from 'ky';
import { admins } from '@/utils';

const replaceWords = (value: string): string =>
    [
        { from: 'алло', to: 'ало' },
        { from: 'блядь', to: 'блять' },
    ].reduce(
        (text, { from, to }) =>
            text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${from}(?![\\p{L}\\p{N}])`, 'giu'), (word) =>
                word[0] === word[0].toUpperCase() ? `${to[0].toUpperCase()}${to.slice(1)}` : to,
            ),
        value,
    );

export const options = new ContextMenuCommandBuilder()
    .setName('audio_to_text')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: MessageContextMenuCommandInteraction) => {
    if (!Object.values(admins).includes(interaction.user.id)) {
        const unauthorized = new TextDisplayBuilder().setContent('You are not allowed to use this command');

        return interaction.reply({
            components: [unauthorized],
            flags:
                (interaction.context !== InteractionContextType.BotDM ? MessageFlags.Ephemeral : 0) |
                MessageFlags.IsComponentsV2,
        });
    }

    const audio = interaction.targetMessage.attachments.find((a) => a.contentType?.startsWith('audio/'));

    if (!audio) {
        const noAudio = new TextDisplayBuilder().setContent('No audio file found in that message');

        return interaction.reply({
            components: [noAudio],
            flags:
                (interaction.context !== InteractionContextType.BotDM ? MessageFlags.Ephemeral : 0) |
                MessageFlags.IsComponentsV2,
        });
    }

    if (!Bun.env.GEMINI_API_KEY) return;

    consola.info(`audio_to_text: ${interaction.user.tag} transcribing ${audio.name}`);
    await interaction.deferReply();

    const response = await ky.post(
        `https://api.cloudflare.com/client/v4/accounts/${Bun.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`,
        {
            headers: { Authorization: `Bearer ${Bun.env.CLOUDFLARE_API_KEY}` },
            json: {
                model: 'assemblyai/universal-3-pro',
                input: {
                    audio_url: audio.url,
                    speaker_labels: true,
                    disfluencies: true,
                },
            },
            timeout: 60000,
            throwHttpErrors: false,
        },
    );

    if (!response.ok) {
        consola.error(`audio_to_text: ${await response.text()}`);

        const failed = new TextDisplayBuilder().setContent('Failed to transcribe audio');

        return interaction.editReply({
            components: [failed],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    const {
        result: { result },
    } = await response.json<{
        result: {
            result: {
                text: string;
                utterances?: { text: string; speaker: string }[] | null;
            };
        };
    }>();

    consola.info('audio_to_text: transcription complete');

    const transcription = new TextDisplayBuilder().setContent(
        [
            '**Transcription:**',
            result.utterances &&
            result.utterances.length > 0 &&
            new Set(result.utterances.map((u) => u.speaker)).size > 1
                ? result.utterances
                      .map((utterance) => `Speaker ${utterance.speaker}: ${replaceWords(utterance.text)}`)
                      .join('\n')
                : replaceWords(result.text),
        ].join('\n'),
    );

    return interaction.editReply({
        components: [transcription],
        flags: MessageFlags.IsComponentsV2,
    });
};
