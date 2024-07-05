import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './utils/commands';
import config from './utils/config';

dotenv.config();

const rest = new REST().setToken(config.token);

try {
    await rest.put(Routes.applicationCommands(config.client_id), { body: loadCommands() });
    console.log('Successfully registered application commands.');
} catch (error) {
    console.error('Failed to register application commands:', error);
}
