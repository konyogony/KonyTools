import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { getEloStats, getFaceitData, timeSince } from './utils/util';
import * as dotenv from 'dotenv';
import { readdirSync } from 'node:fs';
import config from './utils/config';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
    ],
});
client.once('ready', () => {
    if (!client.user) return;

    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity({
        name: '🕒 Please wait...',
        type: ActivityType.Custom,
        state: '',
    });
});

let statusIndex = 0;
let statusInterval: ReturnType<typeof setInterval> | null = null;

const updateStatuses = async () => {
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
            name: `🚨 IN GAME FOR ${setInterval(() => timeSince(match.items[0].started_at), 1000)}🚨`,
            type: ActivityType.Custom,
            state: '',
        },
    ];

    if (match.items[0].status !== 'finished') {
        if (!statusInterval) {
            statusInterval = setInterval(() => {
                if (!client.user) return;

                client.user.setActivity(statuses[statusIndex]);
                statusIndex = (statusIndex + 1) % statuses.length;
            }, 4000);
        }
    } else {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
        client.user.setActivity(statuses[0]);
    }
};

setInterval(updateStatuses, 10000);

const eventFiles = readdirSync(`${__dirname}/events/`).filter((x) => x.endsWith('.ts'));
console.log(eventFiles);
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
