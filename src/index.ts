import Bun from 'bun';
import consola from 'consola';
import { Client, Events, Interaction, PresenceUpdateStatus } from 'discord.js';

const client = new Client({
    intents: [],
    presence: { status: PresenceUpdateStatus.Online },
});

client.once(Events.ClientReady, async (client) => {
    const application = await client.application.fetch();
    consola.info(`Ready! Logged in as ${client.user.tag} for ${application.approximateUserInstallCount} user(s)`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) return;

    try {
        const command = await import(`${import.meta.dir}/interactions/${interaction.commandName}.ts`);
        return await command.run(interaction);
    } catch (message) {
        consola.error(`${message}`);
    }
});

await client.login(Bun.env.DISCORD_TOKEN).catch((message) => {
    consola.error(message);
    process.exit();
});

process.on('SIGINT', async () => {
    await client.destroy();
    process.exit();
});
