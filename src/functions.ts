import axios from 'axios';
import { EmbedBuilder, type ColorResolvable } from 'discord.js';

const faceitApi = axios.create({
    baseURL: 'https://open.faceit.com/data/v4',
    headers: {
        Authorization: `Bearer ${process.env.FACEIT_KEY}`,
    },
});

const getEloStats = (elo: number): { level: number; color: ColorResolvable } => {
    if (elo < 501) {
        return { level: 1, color: '#efeff1' };
    } else if (elo < 751) {
        return { level: 2, color: '#3de64e' };
    } else if (elo < 901) {
        return { level: 3, color: '#3de64e' };
    } else if (elo < 1051) {
        return { level: 4, color: '#fec740' };
    } else if (elo < 1201) {
        return { level: 5, color: '#fec740' };
    } else if (elo < 1351) {
        return { level: 6, color: '#fec740' };
    } else if (elo < 1531) {
        return { level: 7, color: '#fec740' };
    } else if (elo < 1751) {
        return { level: 8, color: '#ff6118' };
    } else if (elo < 2001) {
        return { level: 9, color: '#ff6118' };
    } else {
        return { level: 10, color: '#ee2000' };
    }
};

export const getFaceitData = async (playerID: string) => {
    return faceitApi
        .get(`/players?nickname=${playerID}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => console.log(error));
};

export const getSteamData = async (steamID: string) => {
    const game_data = await axios
        .get(
            `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${process.env.STEAM_KEY}&steamid=${steamID}`
        )
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    const user_data = await axios
        .get(
            `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${steamID}`
        )
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    return [game_data, user_data];
};

export const createEmbed = async (playerID: string) => {
    const faceit_data = await getFaceitData(playerID);
    const [game_data, user_data] = await getSteamData(faceit_data.steam_id_64);
    console.log(game_data, user_data, faceit_data);
    return new EmbedBuilder()
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
                        (stat: { name: string; value: number }) => stat.name === 'total_time_played'
                    ).value / 3600
                )}h`,
                inline: true,
            }
        )
        .addFields(
            {
                name: `Joined Faceit`,
                value: `[<t:${Math.floor(
                    Date.parse(faceit_data.activated_at) / 1000
                )}:f>](https://www.faceit.com/en/players/${faceit_data.nickname})`,
            },
            {
                name: 'Joined steam',
                value: `[<t:${user_data.response.players[0].timecreated}:f>](https://steamcommunity.com/profiles/${faceit_data.steam_id_64})`,
            }
        );
};
