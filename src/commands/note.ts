import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { notesList } from '../storage';
import config from '../utils/config';
import type { INote } from '../types';

export const options = new SlashCommandBuilder()
    .setName('note')
    .setDescription('Note')
    .addSubcommand((sc) =>
        sc
            .setName('create')
            .setDescription('Create a note')
            .addStringOption((s) => s.setName('content').setDescription('Content of the note').setRequired(true))
            .addBooleanOption((b) =>
                b.setName('public').setDescription('Whether the note is public. Defaults to true').setRequired(false),
            ),
    )
    .addSubcommandGroup((scg) =>
        scg
            .setName('view')
            .setDescription('View')
            .addSubcommand((sc) => sc.setName('public').setDescription('View your public notes'))
            .addSubcommand((sc) => sc.setName('private').setDescription('View your private notes')),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    switch (interaction.options.getSubcommand()) {
        case 'create': {
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
            await owner.send({ embeds: [embed_log_success] });

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
        }

        case 'public': {
            const owner = await interaction.client.users.fetch(config.kony_id);
            const embed_log_success = new EmbedBuilder()
                .setTitle(`Action: List Public Notes Success`)
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    {
                        name: `Public Notes`,
                        value: `${notesList.length}`,
                    },
                ]);
            await owner.send({ embeds: [embed_log_success] });

            const notes = notesList.filter((note) => note.public);
            await interaction.reply(
                `${notes.length === 0 ? 'No public notes.' : `${notes.length} public notes. Here is a list:`}`,
            );

            notes.forEach(async (note) => {
                try {
                    const embed = new EmbedBuilder()
                        .setTitle(note.content.slice(0, 20) + (note.content.length > 20 ? '...' : ''))
                        .addFields([
                            { name: 'Author', value: `The author of this note is <@${note.interaction_user_id}>` },
                            {
                                name: 'Content',
                                value: ['```', note.content, '```'].join(''),
                            },
                            {
                                name: 'Time Created',
                                value: `<t:${Math.floor(note.time_created / 1000)}:f>`,
                            },
                        ])
                        .setThumbnail(note.interaction_user_img);

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('remove')
                            .setLabel('Remove this note')
                            .setStyle(ButtonStyle.Danger),
                    );

                    const reply = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true });
                    const collector = reply.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 120000,
                    });

                    collector.on('collect', async (i) => {
                        if (note.interaction_user_id === i.user.id) {
                            const noteIndex = notesList.findIndex((noteFound) => noteFound === note);
                            if (noteIndex !== -1) notesList.splice(noteIndex, 1);
                            await i.reply({ content: 'Note deleted', ephemeral: true });
                            const embed_log_success = new EmbedBuilder()
                                .setTitle(`Action: Public Note Remove Success`)
                                .setColor('#4f9400')
                                .setTimestamp(new Date())
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'User', value: `<@${interaction.user.id}>` },
                                    { name: 'Note Content', value: note.content },
                                    { name: 'Note Time', value: `<t:${Math.floor(note.time_created / 1000)}:f>` },
                                ]);
                            await owner.send({ embeds: [embed_log_success] });
                            collector.stop();
                        } else {
                            await i.reply({ content: 'You are not the owner of this note', ephemeral: true });
                            const embed_log_success = new EmbedBuilder()
                                .setTitle(`Action: Public Note Remove Fail`)
                                .setColor('#e32e12')
                                .setTimestamp(new Date())
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'User', value: `<@${interaction.user.id}>` },
                                    { name: 'Note Content', value: note.content },
                                    { name: 'Note Time', value: `<t:${Math.floor(note.time_created / 1000)}:f>` },
                                ]);
                            await owner.send({ embeds: [embed_log_success] });
                        }
                    });
                    collector.on('end', (_, reason) => reason === 'time' && reply.edit({ components: [] }));
                } catch (e) {
                    console.log(e);
                }
            });

            return;
        }
    }
};
