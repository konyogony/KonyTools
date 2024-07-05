import type { Interaction } from 'discord.js';

export async function run(interaction: Interaction<'cached'>) {
    if (!interaction.isChatInputCommand()) return;

    const commandFile = await import(`../commands/${interaction.commandName}`);

    try {
        await commandFile.run(interaction);
    } catch (e) {
        try {
            if (!interaction.replied) {
                await interaction.reply({ content: 'error', ephemeral: true });
            } else {
                await interaction.editReply('error');
            }
        } catch {
            await interaction.channel!.send('error').catch(() => null);
        }
    }
}
