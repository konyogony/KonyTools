import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { getEloStats, getFaceitData } from './utils/util';
import * as dotenv from 'dotenv';
import { readdirSync } from 'node:fs';
import config from './utils/config';

dotenv.config();

const client = new Client({ intents: [] });

client.on('ready', () => {
    if (!client.user) return;

    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity({
        name: 'starting bot...',
        type: ActivityType.Custom,
        state: '',
    });

    setInterval(async () => {
        if (!client.user) return;

        const [data, match] = await getFaceitData('KonyOgony');
        const elo = data.games.cs2.faceit_elo;
        const statuses = [
            {
                name: `🎮 ELO: ${elo} | LVL ${getEloStats(elo).level}`,
                type: ActivityType.Custom,
                state: '',
            },
            {
                name: `🚨 IN GAME 🚨`,
                type: ActivityType.Custom,
                state: '',
            },
        ];
    }, 60000);
});

const eventFiles = readdirSync(`${__dirname}/events/`).filter((x) => x.endsWith('.js')); // .ts
for (const filename of eventFiles) {
    const file = require(`./events/${filename}`);
    const name = filename.split('.')[0]!;
    if (file.once) {
        client.once(name, file.run);
    } else {
        client.on(name, file.run);
    }
}

client.on('error', console.error);

client.login(config.token).catch((err) => console.error('Login error:', err));
