import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { notesList, reminderList } from '../storage';
import config from '../utils/config';
import type { INote } from '../types';

export const options = new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a note')
    .addStringOption((option) => option.setName('content').setDescription('Content of the note').setRequired(true))
    .addBooleanOption((option) =>
        option.setName('public').setDescription('Whether the note is public. Defaults to true').setRequired(false),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const content = interaction.options.getString('content', true);
    const isPublic = interaction.options.getBoolean('public') ?? true;
    const owner = await interaction.client.users.fetch(config.kony_id);

    const note: INote = {
        interaction_user_id: interaction.user.id,
        interaction_user_img: interaction.user.displayAvatarURL(),
        time_created: Date.now(),
        public: isPublic,
        content: content,
    };

    notesList.push(note);

    const embed_log_success = new EmbedBuilder()
        .setTitle('Action: Note Created')
        .setColor(0x4f9400)
        .setTimestamp(new Date())
        .setThumbnail(note.interaction_user_img)
        .setFields([
            { name: 'User', value: `<@${note.interaction_user_id}>` },
            { name: 'Content', value: `${note.content}` },
            { name: 'Public', value: `${note.public ? 'Yes' : 'No'}` },
        ]);
    if (owner) await owner.send({ embeds: [embed_log_success] });

    const embed_success_create = new EmbedBuilder()
        .setTitle('Note created!')
        .setColor(0x4f9400)
        .setTimestamp(new Date())
        .setThumbnail(note.interaction_user_img)
        .setFields([
            { name: 'Content', value: `${note.content}` },
            { name: 'Public', value: `${note.public ? 'Yes' : 'No'}` },
        ]);

    return await interaction.reply({ embeds: [embed_success_create], ephemeral: isPublic ? false : true });
};
