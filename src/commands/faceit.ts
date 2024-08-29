import { ActivityType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { IMatch } from '../types';
import { getEloStats, getFaceitData, getSteamData } from '../utils';
import config from '../utils/config';

export const options = new SlashCommandBuilder().setName('faceit').setDescription("Get kony's latest info").toJSON();

const isWinner = (match: IMatch): boolean => {
    const faction = match.teams.faction1.players.find((u) => u.nickname === 'kony_ogony') ? 'faction1' : 'faction2';

    return faction === match.results.winner;
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const [faceit_data, match_data] = await getFaceitData('kony_ogony');
    const [{ playerstats }, { response }] = await getSteamData(faceit_data.steam_id_64);

    interaction.client.user.setActivity({
        name: `🎮 ELO: ${faceit_data.games.cs2.faceit_elo} | LVL ${getEloStats(faceit_data.games.cs2.faceit_elo).level}`,
        type: ActivityType.Custom,
        state: '',
    });

    const activated_at = Math.floor(Date.parse(faceit_data.activated_at) / 1000);
    const winner = isWinner(match_data.items[0]);
    const hours = Math.floor(
        playerstats.stats.find((stat: { name: string; value: number }) => stat.name === 'total_time_played').value /
            3600,
    );

    const embed_log_success = new EmbedBuilder()
        .setTitle('Action: Info Success')
        .setTimestamp(new Date())
        .setColor('#4f9400')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFields([
            { name: 'User', value: `<@${interaction.user.id}>` },
            { name: 'ELO', value: `${faceit_data.games.cs2.faceit_elo}` },
            { name: 'Hours', value: `${hours}` },
        ]);
    const owner = await interaction.client.users.fetch(config.kony_id);
    await owner.send({ embeds: [embed_log_success] });

    const eloStats = getEloStats(faceit_data.games.cs2.faceit_elo);
    const embed = new EmbedBuilder()
        .setColor(eloStats.color)
        .setTitle(faceit_data.steam_nickname)
        .setTimestamp(new Date())
        .setThumbnail(faceit_data.avatar)
        .setFields([
            {
                name: 'Faceit Elo',
                value: `${faceit_data.games.cs2.faceit_elo} (LVL ${eloStats.level})`,
                inline: true,
            },
            {
                name: 'Hours',
                value: `${hours}h (not up to date)`,
                inline: true,
            },
            {
                name: `Joined Faceit`,
                value: `[<t:${activated_at}:f>](https://faceit.com/en/players/${faceit_data.nickname})`,
            },
            {
                name: 'Joined Steam',
                value: `[<t:${response.players[0].timecreated}:f>](https://steamcommunity.com/profiles/${faceit_data.steam_id_64})`,
            },
            {
                name: `Last game: ${winner ? 'WIN' : 'LOSS'}`,
                value: `kony_ogony has ${winner ? 'won' : 'lost'} the last match`,
            },
        ]);

    setTimeout(
        () =>
            interaction.client.user.setActivity({
                name: `Bot ready for use!`,
                type: ActivityType.Custom,
                state: '',
            }),
        15000,
    );

    return await interaction.reply({ embeds: [embed] });
};
