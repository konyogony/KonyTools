import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './utils/commands';
import config from './utils/config';

dotenv.config();

const rest = new REST().setToken(config.token);

try {
    const data = await rest.put(Routes.applicationCommands(config.client_id), { body: loadCommands() });
    console.log(data);
} catch (error) {
    console.error('Failed to register application commands:', error);
}
