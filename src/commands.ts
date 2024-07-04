import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

if (
    !process.env.DISCORD_TOKEN ||
    !process.env.CLIENT_ID ||
    !process.env.GUILD_ID
) {
    throw new Error('.env fucked up');
}

const commands = [
    {
        name: 'get-data',
        description: 'Retrive faceit and steam data',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
    });
    console.log('Successfully registered application commands.');
} catch (error) {
    console.error('Failed to register application commands:', error);
}
