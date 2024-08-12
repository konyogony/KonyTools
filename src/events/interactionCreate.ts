import type { Interaction } from 'discord.js';

export async function run(interaction: Interaction<'cached'>) {
    if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

    const commandFile = await import(`../commands/${interaction.commandName}`);

    try {
        await commandFile.run(interaction);
    } catch (e) {
        console.log(e);
    }
}
