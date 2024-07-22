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
    .addStringOption((option) =>
        option
            .setName('item')
            .setDescription('List all reminders or notes')
            .setRequired(true)
            .addChoices([
                { name: 'Reminders', value: 'reminders' },
                { name: 'Public Notes', value: 'public_notes' },
                { name: 'Private notes', value: 'private_notes' },
            ]),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const item = interaction.options.getString('item', true);
    const owner = await interaction.client.users.fetch(config.kony_id);

    const embed_log_success = new EmbedBuilder()
        .setTitle(`Action: List ${item} Success`)
        .setColor(0x4f9400)
        .setTimestamp(new Date())
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            {
                name: `${item}`,
                value: `${item === 'reminders' ? reminderList.length : item === 'public_notes' ? notesList.length : ''}`,
            },
        ]);
    if (owner) await owner.send({ embeds: [embed_log_success] });

    if (item === 'reminders') {
        await interaction.reply(
            `${reminderList.length === 0 ? 'No' : reminderList.length} reminder${reminderList.length > 1 ? 's' : ''} active right now. ${reminderList.length !== 0 ? 'Here is a list:' : ''}`,
        );
    } else if (item === 'public_notes') {
        await interaction.reply(
            `${notesList.length === 0 ? 'No' : notesList.length} public note${notesList.length > 1 ? 's' : ''}. ${notesList.length !== 0 ? 'Here is a list:' : ''}`,
        );
    } else {
        await interaction.reply('');
    }

    switch (item) {
        case 'reminders': {
            reminderList.forEach(async (reminder) => {
                const embed = new EmbedBuilder()
                    .setTitle(reminder.content)
                    .setTimestamp(new Date())
                    .addFields([
                        {
                            name: 'Author',
                            value: `The author of this reminder is <@${reminder.interaction_user_id}>`,
                        },
                        {
                            name: 'Time',
                            value: `<t:${Math.floor(reminder.time / 1000)}:f>`,
                        },
                        {
                            name: 'Mention User',
                            value: `User that is going to be mentioned is <@${reminder.user_mention_id}>`,
                        },
                    ])
                    .setThumbnail(reminder.interaction_user_img);
                await interaction.followUp({ embeds: [embed] });
            });
            return;
        }
        case 'public_notes': {
            notesList.forEach(async (note) => {
                try {
                    const embed = new EmbedBuilder()
                        .setTitle(note.content)
                        .setTimestamp()
                        .addFields([
                            { name: 'Author', value: `The author of this note is <@${note.interaction_user_id}>` },
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
                    const reply = await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true });
                    const collector = reply.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 120000,
                    });
                    const handleTimeout = () => interaction.editReply({ components: [] });
                    collector.on('collect', async (i) => {
                        if (note.interaction_user_id === i.user.id) {
                            const noteIndex = notesList.findIndex((noteFound) => noteFound === note);
                            if (noteIndex !== -1) notesList.splice(noteIndex, 1);
                            await i.reply({ content: 'Note deleted', ephemeral: true });
                            await interaction.deleteReply();
                            collector.stop();
                        } else {
                            await i.reply({ content: 'You are not the owner of this note', ephemeral: true });
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
            break;
        }
    }
};
