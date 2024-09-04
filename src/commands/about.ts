import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getGithubData } from '../utils';
import config from '../utils/config';

export const options = new SlashCommandBuilder().setName('about').setDescription('About kony_ogony').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const git_data = await getGithubData('konyogony');

    const embed_log_success = new EmbedBuilder()
        .setTitle('Action: About Success')
        .setTimestamp(new Date())
        .setColor('#4f9400')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    await owner.send({ embeds: [embed_log_success] });

    const embed = new EmbedBuilder()
        .setColor('#fcd301')
        .setTitle('About kony_ogony')
        .setTimestamp(new Date())
        .setThumbnail(
            'https://cdn.discordapp.com/avatars/1258371284858044456/64a4e8fd535ef8be64f2bb5cb56de0b5.webp?size=1024&format=webp&width=0&height=256',
        )
        .setFields([
            {
                name: 'About me',
                value: "Hey there! I'm kony_ogony, a junior fullstack dev, making cool open-source stuff for myself and others :0",
            },
            {
                name: 'GitHub',
                value: `Checkout my cool [GitHub account](https://github.com/konyogony) which currently has ${git_data.public_repos} public repos and it's been up since <t:${new Date(git_data.created_at).getTime() / 1000}:f>!`,
                inline: true,
            },
            {
                name: 'Website',
                value: 'Currently developing own website https://konyogony.dev, it will be up soon with lots of cool features! :D',
                inline: true,
            },
            {
                name: 'Discord Server',
                value: 'You can join my [Discord server](https://discord.gg/fPW9EFFU) to for further support and community news. By the way big shoutout to [PadowYT2](https://padow.ru) for helping me to make everything possible',
            },
        ]);

    return await interaction.reply({ embeds: [embed] });
};
