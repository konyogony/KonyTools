import { ActivityType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';
import axios from 'axios';

export const options = new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Set a timer to shutdown')
    .addNumberOption((option) =>
        option
            .setName('time')
            .setDescription('In how many minutes would it shut down')
            .setRequired(true)
            .setMinValue(1),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const time = interaction.options.getNumber('time', true);

    const embed_log = new EmbedBuilder()
        .setTitle('Action: Shutdown')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            { name: 'Minutes', value: `<@${time}>` },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:f>` },
        ]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    if (owner) await owner.send({ embeds: [embed_log] });

    if (interaction.user.id !== config.kony_id)
        return await interaction.reply('Sorry! You dont have permission to perform this action');

    try {
        await axios.post('https://quietly-nice-bull.ngrok-free.app/shutdown', time);
    } catch (error) {
        console.log(error);
    }

    const shutdownTime = Date.now() + time * 60000;

    setInterval(() => {
        if (!interaction.client.user) return;

        const now = Date.now();
        const timeLeft = shutdownTime - now;
        if (timeLeft <= 0)
            return interaction.client.user.setActivity({
                name: 'Shutting down now',
                type: ActivityType.Custom,
                state: '',
            });

        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
        interaction.client.user.setActivity({
            name: `Shutting down in ${minutesLeft}m ${secondsLeft}s`,
            type: ActivityType.Custom,
            state: '',
        });
    }, 5000);

    return await interaction.reply(`Shutdown is set for <t:${shutdownTime}:f>`);
};
