import dayjs from 'dayjs';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { reminderList } from '../reminderList';

export const options = {
    ...new SlashCommandBuilder().setName('list').setDescription('List all active reminders').toJSON(),
    integration_types: [1],
    contexts: [0, 1, 2],
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    try {
        const logFilePath = path.join(__dirname, '../command_log.log');
        fs.appendFileSync(
            logFilePath,
            `Username: ${interaction.user.username}, Action: List,Thailand Time: ${dayjs().format('YYYY-MM-DD HH:mm')}\n`,
            'utf8',
        );
    } catch (e) {
        console.error(e);
    }

    await interaction.reply(
        `${reminderList.length === 0 ? 'No' : reminderList.length} reminder${reminderList.length > 1 ? 's' : ''} active right now! ${reminderList.length !== 0 ? 'Here is a list:' : ''}`,
    );

    reminderList.forEach(async (reminder) => {
        const Embed = new EmbedBuilder()
            .setTitle(reminder.content)
            .addFields([
                { name: 'Author', value: `The author of this reminder is <@${reminder.interaction_user_id}>` },
                {
                    name: 'Time',
                    value: `${dayjs(reminder.time).format('dddd, DD MMMM YYYY, HH:mm')} ${reminder.timezone}`,
                },
                { name: 'Mention User', value: `User that is going to be mentioned is <@${reminder.user_mention_id}>` },
            ])
            .setThumbnail(reminder.interaction_user_img);
        await interaction.followUp({ embeds: [Embed] });
    });
};
