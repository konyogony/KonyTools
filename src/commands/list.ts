import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { reminderList } from '../reminderList';
import config from '../utils/config';

export const options = new SlashCommandBuilder().setName('list').setDescription('List all active reminders').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const embed_log = new EmbedBuilder().setTitle('Action: List').setFields([
        { name: 'User', value: `<@${interaction.user.id}>` },
        { name: 'Reminders', value: `${reminderList.length}` },
        { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
    ]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    if (owner) await owner.send({ embeds: [embed_log] });

    await interaction.reply(
        `${reminderList.length === 0 ? 'No' : reminderList.length} reminder${reminderList.length > 1 ? 's' : ''} active right now! ${reminderList.length !== 0 ? 'Here is a list:' : ''}`,
    );

    reminderList.forEach(async (reminder) => {
        const embed = new EmbedBuilder()
            .setTitle(reminder.content)
            .addFields([
                { name: 'Author', value: `The author of this reminder is <@${reminder.interaction_user_id}>` },
                {
                    name: 'Time',
                    value: `<t:${reminder.time}:f> ${reminder.timezone}`,
                },
                { name: 'Mention User', value: `User that is going to be mentioned is <@${reminder.user_mention_id}>` },
            ])
            .setThumbnail(reminder.interaction_user_img);

        await interaction.followUp({ embeds: [embed] });
    });

    return;
};
