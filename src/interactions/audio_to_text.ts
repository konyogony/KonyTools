import { chat } from '@tanstack/ai';
import { createGeminiChat } from '@tanstack/ai-gemini';
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
import { admins, parseError } from '@/utils';

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

    try {
        const buffer = await ky.get(audio.url).arrayBuffer();
        const stream = chat({
            adapter: createGeminiChat('gemini-2.5-flash', Bun.env.GEMINI_API_KEY),
            temperature: 0.5,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'audio',
                            source: {
                                type: 'data',
                                value: Buffer.from(buffer).toString('base64'),
                                mimeType: audio.contentType || 'audio/mp3',
                            },
                        },
                        {
                            type: 'text',
                            content: [
                                'This is a voice message from a friend in Discord. Create a precise transcript of exactly what is being said.',
                                '\n1. **Verbatim Accuracy:** Type out full swear words, slang, and filler words. Do not blur or censor any profanity; accuracy is the priority.',
                                '2. **Language Handling:** If the speaker uses two different languages, keep them separate in the text and do not translate them.',
                                '3. **Formatting:** Analyze the tone. If the speaker sounds official or serious, use proper capitalization and punctuation. If the speaker is casual, feel free to use lowercase or loose punctuation to match the vibe.',
                            ].join('\n'),
                        },
                    ],
                },
            ],
        });

        let text = '';
        let error: string | null = null;

        for await (const chunk of stream) {
            if (chunk.type === 'TEXT_MESSAGE_CONTENT' && chunk.delta) text += chunk.delta;
            if (chunk.type === 'RUN_ERROR') error = parseError(chunk.error?.message || 'Unknown error');
        }

        text = text.trim();

        if (error || !text) {
            const message = error || 'Empty response';
            consola.warn(`audio_to_text: ${message}`);

            const empty = new TextDisplayBuilder().setContent(message);

            return interaction.editReply({
                components: [empty],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        consola.info(`audio_to_text: transcription complete (${text.length} chars)`);

        const result = new TextDisplayBuilder().setContent(`**Transcription:**\n${text}`);

        return interaction.editReply({
            components: [result],
            flags: MessageFlags.IsComponentsV2,
        });
    } catch (err) {
        consola.error(`audio_to_text: ${err}`);

        const errorText = new TextDisplayBuilder().setContent('Failed to transcribe audio');

        return interaction.editReply({
            components: [errorText],
            flags: MessageFlags.IsComponentsV2,
        });
    }
};
