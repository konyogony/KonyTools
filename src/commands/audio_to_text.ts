import fs from 'fs/promises';
import path from 'path';
import { createPartFromUri, createUserContent } from '@google/genai';
import axios from 'axios';
import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from 'discord.js';
import { v4 as uuid } from 'uuid';
import { ai } from '..';

export const options = new ContextMenuCommandBuilder()
    .setName('audio_to_text')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;

    const audio = interaction.targetMessage.attachments.find((a) => a.contentType?.startsWith('audio/'));

    if (!audio) {
        return interaction.reply({
            content: 'no audio file found in that message 💀',
            ephemeral: true,
        });
    }

    await interaction.deferReply();

    let filePath: string | null = null;

    try {
        const res = await axios.get(audio.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);
        filePath = path.join('/tmp', `${uuid()}-${audio.name}`);
        await fs.writeFile(filePath, buffer);

        const myfile = await ai.files.upload({
            file: filePath,
            config: { mimeType: audio.contentType || 'audio/mp3' },
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: createUserContent([
                createPartFromUri(myfile.uri, myfile.mimeType),
                'This is a voice message from a friend in discord. Create a transcript of the words he is saying.',
            ]),
        });

        return await interaction.editReply({ content: `📝 **Transcription:**\n${response.text}` });
    } catch (err: any) {
        console.error(err);
        return await interaction.editReply({ content: 'bro it failed to transcribe 😵' });
    } finally {
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkErr) {
                console.error('Error deleting temporary file:', unlinkErr);
            }
        }
    }
};
