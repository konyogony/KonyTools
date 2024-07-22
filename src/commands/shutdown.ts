import { ActivityType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../utils/config';
import axios from 'axios';

export const options = new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Set a timer to shutdown')
    .addNumberOption((n) =>
        n.setName('time').setDescription('In how many minutes would it shut down').setRequired(true).setMinValue(1),
    )
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const time = interaction.options.getNumber('time', true);

    const owner = await interaction.client.users.fetch(config.kony_id);

    if (![config.kony_id, '684472142804549637'].includes(interaction.user.id)) {
        const embed_log_fail_permission = new EmbedBuilder()
            .setTitle('Action: Shutdown No Permission')
            .setColor('#e32e12')
            .setTimestamp(new Date())
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFields([
                { name: 'User', value: `<@${interaction.user.id}>` },
                { name: 'Minutes', value: `${time}` },
            ]);
        await owner.send({ embeds: [embed_log_fail_permission] });
        return await interaction.reply('Sorry! You dont have permission to perform this action');
    }

    try {
        await axios.post('https://quietly-nice-bull.ngrok-free.app/shutdown', `${time}`, {
            headers: {
                Authorization: `Bearer ${config.bearer_token}`,
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.log(error);
        return await interaction.reply('An error occured, check the console');
    }

    const shutdownTime = Date.now() + time * 60000;

    const embed_log_success = new EmbedBuilder()
        .setTitle('Action: Shutdown Success')
        .setColor('#4f9400')
        .setTimestamp(new Date())
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            { name: 'Minutes', value: `${time}` },
        ]);
    await owner.send({ embeds: [embed_log_success] });

    setTimeout(
        () => {
            clearInterval(timer);
            interaction.client.user.setActivity({
                name: `Bot ready for use!`,
                type: ActivityType.Custom,
                state: '',
            });
        },
        (time + 1) * 60000,
    );

    const timer = setInterval(() => {
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

    return await interaction.reply(`Shutdown is set for <t:${Math.floor(shutdownTime / 1000)}:f>`);
};
