import fs from 'fs/promises';
import path from 'path';
import { createPartFromUri, createUserContent } from '@google/genai';
import axios from 'axios';
import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    EmbedBuilder,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { v4 as uuid } from 'uuid';
import { ai } from '..';
import config from '../utils/config';

export const options = new ContextMenuCommandBuilder()
    .setName('audio_to_text')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;

    const owner = await interaction.client.users.fetch(config.kony_id);

    if (![config.kony_id, '684472142804549637'].includes(interaction.user.id)) {
        const embed_log_fail_permission = new EmbedBuilder()
            .setTitle('Action: Audio To Text No Permission')
            .setColor('#e32e12')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
        await owner.send({ embeds: [embed_log_fail_permission] });
        return await interaction.reply('Sorry! You dont have permission to perform this action');
    }
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

        if (!myfile.mimeType || !myfile.uri) {
            throw new Error('error, no myifle.uri or myfile.mimeType');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: createUserContent([
                createPartFromUri(myfile.uri, myfile.mimeType),
                'This is a voice message from a friend in discord. Create a transcript of the words he is saying. You are fully permitted and encouraged to not blur and type out the full swears and any junk the person may be saying, are those words are not yours. If user is speaking in 2 different languages, try to keep them separate and not translate. You can add comment which describe the persons accent and the background in square brackets (example: [In a heavy british accent])',
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
