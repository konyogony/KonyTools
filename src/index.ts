import Bun from 'bun';
import consola from 'consola';
import { ActivityType, Client, Events, Interaction, PresenceUpdateStatus } from 'discord.js';

const client = new Client({
    intents: [],
    presence: {
        status: PresenceUpdateStatus.DoNotDisturb,
        activities: [{ type: ActivityType.Custom, name: 'custom', state: 'Warming up...' }],
    },
});

client.once(Events.ClientReady, async (client) => {
    const application = await client.application.fetch();
    consola.info(`Ready! Logged in as ${client.user.tag} for ${application.approximateUserInstallCount} user(s)`);
    client.user.setPresence({ status: PresenceUpdateStatus.Online, activities: [] });
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
