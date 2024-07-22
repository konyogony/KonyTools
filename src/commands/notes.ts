import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from 'discord.js';
import { notesList, reminderList } from '../storage';
import config from '../utils/config';

export const options = new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all active reminders')
    .addStringOption((s) =>
        s
            .setName('item')
            .setDescription('List all reminders or notes')
            .setRequired(true)
            .addChoices([
                { name: 'Public notes', value: 'public_notes' },
                { name: 'Private notes', value: 'private_notes' },
            ]),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const item = interaction.options.getString('item', true);
    const owner = await interaction.client.users.fetch(config.kony_id);

    const embed_log_success = new EmbedBuilder()
        .setTitle(`Action: List ${item} Success`)
        .setColor('#4f9400')
        .setTimestamp(new Date())
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            {
                name: `${item}`,
                value: `${item === 'public_notes' ? notesList.length : notesList.filter((note) => note.interaction_user_id === interaction.user.id).length}`,
            },
        ]);
    await owner.send({ embeds: [embed_log_success] });

    if (item === 'public_notes') {
        const num = notesList.filter((note) => note.public === true).length;
        await interaction.reply(`${num === 0 ? 'No' : num} public notes. ${num !== 0 ? 'Here is a list:' : ''}`);
    } else {
        const num = notesList.filter((note) => note.interaction_user_id === interaction.user.id).length;
        await interaction.reply(`${num === 0 ? 'No' : num} private notes. ${num !== 0 ? 'Here is a list:' : ''}`);
    }

    switch (item) {
        case 'public_notes': {
            notesList
                .filter((note) => note.public === true)
                .forEach(async (note) => {
                    try {
                        const embed = new EmbedBuilder()
                            .setTitle(note.content.slice(0, 20) + (note.content.length > 20 ? '...' : ''))
                            .addFields([
                                { name: 'Author', value: `The author of this note is <@${note.interaction_user_id}>` },
                                {
                                    name: 'Content',
                                    value: `\`\`\`${note.content}\`\`\``,
                                },
                                {
                                    name: 'Time Created',
                                    value: `<t:${Math.floor(note.time_created / 1000)}:f>`,
                                },
                            ])
                            .setThumbnail(note.interaction_user_img);
                        const remove = new ButtonBuilder()
                            .setCustomId('remove')
                            .setLabel('Remove this note')
                            .setStyle(ButtonStyle.Danger);
                        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(remove);
                        const reply = await interaction.followUp({
                            embeds: [embed],
                            components: [row],
                            fetchReply: true,
                        });
                        const collector = reply.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 120000,
                        });
                        const handleTimeout = () => reply.edit({ components: [] });
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
                        collector.on('end', (_, reason) => {
                            if (reason === 'time') handleTimeout();
                        });
                    } catch (e) {
                        console.log(e);
                    }
                });
            return;
        }
        case 'private_notes': {
            notesList
                .filter((note) => note.interaction_user_id === interaction.user.id)
                .forEach(async (note) => {
                    try {
                        const embed = new EmbedBuilder()
                            .setTitle(note.content.slice(0, 20) + (note.content.length > 20 ? '...' : ''))
                            .addFields([
                                { name: 'Author', value: `The author of this note is <@${note.interaction_user_id}>` },
                                {
                                    name: 'Content',
                                    value: `\`\`\`${note.content}\`\`\``,
                                },
                                {
                                    name: 'Time Created',
                                    value: `<t:${Math.floor(note.time_created / 1000)}:f>`,
                                },
                            ])
                            .setThumbnail(note.interaction_user_img);
                        const remove = new ButtonBuilder()
                            .setCustomId('remove')
                            .setLabel('Remove this note')
                            .setStyle(ButtonStyle.Danger);
                        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(remove);
                        const reply = await interaction.followUp({
                            embeds: [embed],
                            components: [row],
                            fetchReply: true,
                            ephemeral: true,
                        });
                        const collector = reply.createMessageComponentCollector({
                            componentType: ComponentType.Button,
                            time: 120000,
                        });
                        const handleTimeout = () => reply.edit({ components: [] });
                        collector.on('collect', async (i) => {
                            await i.reply({ content: 'Note deleted', ephemeral: true });
                            const embed_log_success = new EmbedBuilder()
                                .setTitle(`Action: Private Note Remove Success`)
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
                        collector.on('end', (_, reason) => {
                            if (reason === 'time') handleTimeout();
                        });
                    } catch (e) {
                        console.log(e);
                    }
                });
            return;
        }
    }
};
