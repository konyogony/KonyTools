import { Client, GatewayIntentBits } from 'discord.js';
import { createEmbed } from './functions';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'get-data') {
        interaction.reply({
            embeds: [await createEmbed('KonyOgony')],
        });
    }
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN).catch((err) => console.error('Login error:', err));
