import Bun from 'bun';
import consola from 'consola';
import { REST, Routes } from 'discord.js';

const loadCommands = async () => {
    const commands = [];
    const glob = new Bun.Glob(`${import.meta.dir}/interactions/*.ts`);

    for (const file of glob.scanSync('.')) {
        const module = await import(file);
        if (module.options) commands.push(module.options.toJSON());
    }

    return commands;
};

await new REST()
    .setToken(Bun.env.DISCORD_TOKEN as string)
    .put(Routes.applicationCommands(Bun.env.CLIENT_ID as string), { body: await loadCommands() })
    .then(() => consola.info('Successfully registered application commands'))
    .catch((message) => consola.error(message));

process.exit();
