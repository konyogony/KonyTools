import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './utils/commands';
import config from './utils/config';

dotenv.config();

new REST()
    .setToken(config.token)
    .put(Routes.applicationCommands(config.client_id), { body: loadCommands() })
    .then(() => {
        console.log('Successfully registered application commands.');
        process.exit();
    })
    .catch((error) => console.error('Failed to register application commands:', error));
