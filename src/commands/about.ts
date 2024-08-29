import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getGithubData } from '../utils';
import config from '../utils/config';

export const options = new SlashCommandBuilder().setName('about').setDescription('About kony_ogony').toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const git_data = await getGithubData('kony-ogony');

    const embed_log_success = new EmbedBuilder()
        .setTitle('Action: About Success')
        .setTimestamp(new Date())
        .setColor('#4f9400')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([{ name: 'User', value: `<@${interaction.user.id}>` }]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    await owner.send({ embeds: [embed_log_success] });

    const embed = new EmbedBuilder()
        .setColor('#14484b')
        .setTitle('About kony_ogony')
        .setTimestamp(new Date())
        .setThumbnail(
            'https://cdn.discordapp.com/avatars/1258371284858044456/64a4e8fd535ef8be64f2bb5cb56de0b5.webp?size=1024&format=webp&width=0&height=256',
        )
        .setFields([
            {
                name: 'About me',
                value: 'Hey there! Im kony_ogony, a junior fullstack dev, making cool open-source stuff for myself and others :0',
            },
            {
                name: 'Github',
                value: `Checkout my cool [github account](https://github.com/kony-ogony) which currently has ${git_data.public_repos} public repos and its been up since <t:${git_data.created_at.getSeconds()}:f> !`,
                inline: true,
            },
            {
                name: 'Website',
                value: 'Currently developing a personal website at https://konyogony.dev, it will be up soon with lots of cool features! :D',
                inline: true,
            },
            {
                name: 'Discord Server',
                value: 'You can join my discord server to for further support and community news at https://discord.gg/fPW9EFFU.',
                inline: true,
            },
            {
                name: 'Contributors',
                value: 'Big shoutout to [PadowYT2](https:://github.com/PadowYT2) for helping me and making everything possible',
            },
        ]);

    return await interaction.reply({ embeds: [embed] });
};
