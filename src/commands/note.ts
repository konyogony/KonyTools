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
            .addStringOption((s) => s.setName('content').setDescription('Content of the note').setRequired(true)),
    )
    .addSubcommandGroup((scg) =>
        scg
            .setName('view')
            .setDescription('View all/your notes')
            .addSubcommand((sc) => sc.setName('all').setDescription('View all notes'))
            .addSubcommand((sc) => sc.setName('yours').setDescription('View your notes')),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const owner = await interaction.client.users.fetch(config.kony_id);
    switch (interaction.options.getSubcommand()) {
        case 'create': {
            const content = interaction.options.getString('content', true);

            const note: INote = {
                interaction_user_id: interaction.user.id,
                interaction_user_img: interaction.user.displayAvatarURL(),
                time_created: Date.now(),
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
                ]);
            await owner.send({ embeds: [embed_log_success] });

            const embed_success_create = new EmbedBuilder()
                .setTitle('Note created!')
                .setColor(0x4f9400)
                .setTimestamp(new Date())
                .setThumbnail(note.interaction_user_img)
                .setFields([{ name: 'Content', value: `${note.content}` }]);

            return await interaction.reply({ embeds: [embed_success_create] });
        }
        default: {
            let notes;

            if (interaction.options.getSubcommand() === 'all') {
                notes = notesList;
            } else {
                notes = notesList.filter((note) => note.interaction_user_id === interaction.user.id);
            }

            if (notes.length === 0) {
                return await interaction.reply({ content: 'No notes found.' });
            }

            let activeIndex = 0;
            let note = notes[activeIndex];

            const removeButton = new ButtonBuilder().setCustomId('remove').setLabel('🗑️').setStyle(ButtonStyle.Danger);
            const leftButton = new ButtonBuilder().setCustomId('left').setLabel('⬅️').setStyle(ButtonStyle.Secondary);
            const rightButton = new ButtonBuilder().setCustomId('right').setLabel('➡️').setStyle(ButtonStyle.Secondary);

            const generateEmbed = (note: INote) =>
                new EmbedBuilder()
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

            const reply = await interaction.reply({
                content: `${notes.length > 1 ? 'Page ' + (activeIndex + 1) + ' of ' + notes.length : ''}`,
                embeds: [generateEmbed(note)],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(leftButton, removeButton, rightButton),
                ],
                fetchReply: true,
            });

            const embed_log_success = new EmbedBuilder()
                .setTitle(`Action: Note Show Success`)
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    {
                        name: `Note count`,
                        value: `${notes.length}`,
                    },
                ]);
            await owner.send({ embeds: [embed_log_success] });

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 120000,
            });

            collector.on('collect', async (i) => {
                switch (i.customId) {
                    case 'remove': {
                        if (note.interaction_user_id === i.user.id) {
                            const noteIndex = notes.findIndex((noteFound) => noteFound === note);
                            if (noteIndex !== -1) notes.splice(noteIndex, 1);
                            await i.reply({ content: 'Note deleted', ephemeral: true });

                            const embed_log_success = new EmbedBuilder()
                                .setTitle(`Action: Note Remove Success`)
                                .setColor('#4f9400')
                                .setTimestamp(note.time_created)
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'User', value: `<@${interaction.user.id}>` },
                                    { name: 'Note Content', value: note.content },
                                ]);

                            await owner.send({ embeds: [embed_log_success] });

                            if (notes.length === 0) {
                                await reply.edit({ content: 'No more notes.', embeds: [], components: [] });
                                collector.stop();
                                return;
                            }

                            if (activeIndex >= notes.length) activeIndex = notes.length - 1;
                            note = notes[activeIndex];
                        } else {
                            const embed_log_fail = new EmbedBuilder()
                                .setTitle(`Action: Note Remove No Permission`)
                                .setColor('#e32e12')
                                .setTimestamp(new Date())
                                .setThumbnail(interaction.user.displayAvatarURL())
                                .setFields([
                                    { name: 'User', value: `<@${interaction.user.id}>` },
                                    { name: 'Note Content', value: note.content },
                                    { name: 'Author', value: `<@${note.interaction_user_id}>` },
                                ]);
                            await owner.send({ embeds: [embed_log_fail] });
                            await i.reply({ content: 'You are not the author of this note', ephemeral: true });
                        }
                        break;
                    }
                    case 'left': {
                        activeIndex = activeIndex === 0 ? notes.length - 1 : activeIndex - 1;
                        note = notes[activeIndex];
                        break;
                    }
                    case 'right': {
                        activeIndex = activeIndex === notes.length - 1 ? 0 : activeIndex + 1;
                        note = notes[activeIndex];
                        break;
                    }
                }

                await i.update({
                    content: `${notes.length > 1 ? 'Page ' + (activeIndex + 1) + ' of ' + notes.length : ''}`,
                    embeds: [generateEmbed(note)],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(leftButton, removeButton, rightButton),
                    ],
                });
            });

            collector.on('end', (_, reason) => reason === 'time' && reply.edit({ components: [] }));
            return;
        }
    }
};
