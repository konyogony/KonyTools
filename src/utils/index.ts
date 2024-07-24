import axios from 'axios';
import type { ColorResolvable } from 'discord.js';
import config from './config';

const faceitApi = axios.create({
    baseURL: 'https://open.faceit.com/data/v4',
    headers: {
        Authorization: `Bearer ${config.faceit_key}`,
    },
});

export const getEloStats = (elo: number): { level: number; color: ColorResolvable } => {
    switch (true) {
        case elo < 501:
            return { level: 1, color: '#efeff1' };
        case elo < 751:
            return { level: 2, color: '#3de64e' };
        case elo < 901:
            return { level: 3, color: '#3de64e' };
        case elo < 1051:
            return { level: 4, color: '#fec740' };
        case elo < 1201:
            return { level: 5, color: '#fec740' };
        case elo < 1351:
            return { level: 6, color: '#fec740' };
        case elo < 1531:
            return { level: 7, color: '#fec740' };
        case elo < 1751:
            return { level: 8, color: '#ff6118' };
        case elo < 2001:
            return { level: 9, color: '#ff6118' };
        default:
            return { level: 10, color: '#ee2000' };
    }
};

export const getFaceitData = async (playerID: string) => {
    const faceit_data = await faceitApi
        .get(`/players?nickname=${playerID}`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => console.log(error));
    const match_data = await faceitApi
        .get(`/players/${faceit_data.player_id}/history`)
        .then((response) => {
            return response.data;
        })
        .catch((error) => console.log(error));
    return [faceit_data, match_data];
};

export const getSteamData = async (steamID: string) => {
    const game_data = await axios
        .get(
            `http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${config.steam_key}&steamid=${steamID}`,
        )
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    const user_data = await axios
        .get(
            `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steam_key}&steamids=${steamID}`,
        )
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    return [game_data, user_data];
};

export const timeSince = (timestamp: number): string => {
    const now = Date.now();
    const past = timestamp * 1000;
    const elapsed = now - past;

    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;

    if (hours > 0)
        return `${hours}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;

    return `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
};
