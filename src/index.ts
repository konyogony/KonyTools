import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { getEloStats, getFaceitData } from './util';
import * as dotenv from 'dotenv';
import { createEmbed } from './commands/check-kony';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    client.user?.setActivity({
        name: 'starting bot...',
        type: ActivityType.Custom,
        state: '',
    });
    setInterval(async () => {
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
        client.user?.setActivity(
            match.items[0].status !== 'finished' ? statuses[Math.floor(Math.random() * statuses.length)] : statuses[0]
        );
    }, 60000);
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
