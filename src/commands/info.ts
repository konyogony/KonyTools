import type { Imatch } from '../types';
import { getEloStats, getFaceitData, getSteamData } from '../utils/util';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const options = {
    ...new SlashCommandBuilder().setName('info').setDescription("Get kony's latest info").toJSON(),
    ...{ integration_types: [1], contexts: [0, 1, 2] },
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const [faceit_data, match_data] = await getFaceitData('kony_ogony');
    const [game_data, user_data] = await getSteamData(faceit_data.steam_id_64);

    const isWinner = (match: Imatch) => {
        let kony_faction: 'faction1' | 'faction2';
        if (match.teams.faction1.players.find((u) => u.nickname === 'kony_ogony')) {
            kony_faction = 'faction1';
        } else {
            kony_faction = 'faction2';
        }
        if (match.results.winner === kony_faction) {
            return true;
        }
    };

    const embed = new EmbedBuilder()
        .setColor(getEloStats(faceit_data.games.cs2.faceit_elo).color)
        .setTitle(faceit_data.steam_nickname)
        .setThumbnail(faceit_data.avatar)
        .addFields(
            {
                name: 'Faceit Elo',
                value: `${faceit_data.games.cs2.faceit_elo} (LVL ${
                    getEloStats(faceit_data.games.cs2.faceit_elo).level
                })`,
                inline: true,
            },
            {
                name: 'Hours',
                value: `${Math.floor(
                    game_data.playerstats.stats.find(
                        (stat: { name: string; value: number }) => stat.name === 'total_time_played',
                    ).value / 3600,
                )}h (not up to date)`,
                inline: true,
            },
        )
        .addFields(
            {
                name: `Joined Faceit`,
                value: `[<t:${Math.floor(
                    Date.parse(faceit_data.activated_at) / 1000,
                )}:f>](https://www.faceit.com/en/players/${faceit_data.nickname})`,
            },
            {
                name: 'Joined Steam',
                value: `[<t:${user_data.response.players[0].timecreated}:f>](https://steamcommunity.com/profiles/${faceit_data.steam_id_64})`,
            },
        )
        .addFields({
            name: `Last game: ${isWinner(match_data.items[0]) ? 'WIN' : 'LOSS'}`,
            value: `kony_ogony has ${isWinner(match_data.items[0]) ? 'won' : 'lost'} the last match`,
        });

    return interaction.reply({ embeds: [embed] });
};
