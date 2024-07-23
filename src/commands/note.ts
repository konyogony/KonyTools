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
        case 'all': {
            const notes = notesList;

            const embed_log_success = new EmbedBuilder()
                .setTitle(`Action: List All Notes Success`)
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    {
                        name: `All Notes`,
                        value: `${notes.length}`,
                    },
                ]);
            await owner.send({ embeds: [embed_log_success] });

            await interaction.reply(
                `${notes.length === 0 ? 'No notes found.' : `${notes.length} notes found. Here is a list:`}`,
            );

            notes.forEach(async (note) => {
                const embed_success_list = new EmbedBuilder()
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

                if (note.interaction_user_id === interaction.user.id) {
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('remove')
                            .setLabel('Remove this note')
                            .setStyle(ButtonStyle.Danger),
                    );
                    const reply = await interaction.followUp({
                        embeds: [embed_success_list],
                        components: [row],
                        fetchReply: true,
                        ephemeral: true,
                    });

                    const collector = reply.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 120000,
                    });

                    collector.on('collect', async (i) => {
                        const noteIndex = notes.findIndex((noteFound) => noteFound === note);
                        if (noteIndex !== -1) notes.splice(noteIndex, 1);
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
                    });
                    collector.on('end', (_, reason) => reason === 'time' && reply.edit({ components: [] }));
                } else {
                    await interaction.followUp({
                        embeds: [embed_success_list],
                        ephemeral: true,
                    });
                }
            });

            return;
        }

        case 'yours': {
            const notes = notesList.filter((note) => note.interaction_user_id === interaction.user.id);

            const embed_log_success = new EmbedBuilder()
                .setTitle(`Action: List User Notes Success`)
                .setColor('#4f9400')
                .setTimestamp(new Date())
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFields([
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    {
                        name: `Users Notes`,
                        value: `${notes.length}`,
                    },
                ]);
            await owner.send({ embeds: [embed_log_success] });

            await interaction.reply(
                `${notes.length === 0 ? 'No notes found.' : `${notes.length} notes found. Here is a list:`}`,
            );

            notes.forEach(async (note) => {
                const embed_success_list = new EmbedBuilder()
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
                    new ButtonBuilder().setCustomId('remove').setLabel('Remove this note').setStyle(ButtonStyle.Danger),
                );
                const reply = await interaction.followUp({
                    embeds: [embed_success_list],
                    components: [row],
                    fetchReply: true,
                    ephemeral: true,
                });

                const collector = reply.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 120000,
                });

                collector.on('collect', async (i) => {
                    const noteIndex = notes.findIndex((noteFound) => noteFound === note);
                    if (noteIndex !== -1) notes.splice(noteIndex, 1);
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
                });
                collector.on('end', (_, reason) => reason === 'time' && reply.edit({ components: [] }));
            });

            return;
        }
    }
};
