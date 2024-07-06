import { getEloStats, getFaceitData, getSteamData } from '../utils/util';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const options = {
    ...new SlashCommandBuilder().setName('status').setDescription("Get kony's stats").toJSON(),
    ...{ integration_types: [1], contexts: [0, 1, 2] },
};

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const [faceit_data, match_data] = await getFaceitData('KonyOgony');
    const [game_data, user_data] = await getSteamData(faceit_data.steam_id_64);
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
                )}h`,
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
            name: 'Status',
            value:
                match_data.items[0].status !== 'finished'
                    ? `In a game, started <t:${Math.floor(
                          match_data.items[0].started_at / 1000,
                      )}:f>, currently in [this](https://www.faceit.com/en/cs2/room/${match_data.items[0].match_id}) room`
                    : 'Not in a game',
        });

    return interaction.reply({ embeds: [embed] });
};
