import { Client, GatewayIntentBits } from 'discord.js';
import { createEmbed } from './functions';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'check-kony') {
        try {
            const embed = await createEmbed('KonyOgony');
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating embed:', error);
            await interaction.reply('There was an error while executing this command!');
        }
    }
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN).catch((err) => console.error('Login error:', err));
