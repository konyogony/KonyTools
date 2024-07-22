import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { getEloStats, getFaceitData, timeSince } from './utils/util';
import * as dotenv from 'dotenv';
import { readdirSync } from 'node:fs';
import config from './utils/config';

dotenv.config();

export const client = new Client({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions],
});

client.once('ready', async () => {
    if (!client.user) return;
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity({
        name: `Bot ready for use! :steam_happy_pd:`,
        type: ActivityType.Custom,
        state: '',
    });
});

const eventFiles = readdirSync(`${__dirname}/events/`).filter((x) => x.endsWith('.ts'));
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
