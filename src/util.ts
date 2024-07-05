import axios from 'axios';
import { type ColorResolvable } from 'discord.js';
// import fs from 'fs';
// import path from 'path';

const faceitApi = axios.create({
    baseURL: 'https://open.faceit.com/data/v4',
    headers: {
        Authorization: `Bearer ${process.env.FACEIT_KEY}`,
    },
});

export const getEloStats = (elo: number): { level: number; color: ColorResolvable } => {
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

// Ignore

// const [faceit_data, match_data] = await getFaceitData('KonyOgony');
// const [game_data, user_data] = await getSteamData(faceit_data.steam_id_64);

// const dataToWrite = JSON.stringify(
//     {
//         faceit_data: faceit_data,
//         match_data: match_data,
//     },
//     null,
//     2
// );
// const filePath = path.resolve(__dirname, '../test/data.json');

// fs.writeFileSync(filePath, dataToWrite, 'utf8');
// console.log('Data written to file successfully.');
