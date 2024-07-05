import type { Interaction } from 'discord.js';
import { readdirSync } from 'node:fs';

export default async (interaction: Interaction<'cached'>) => {
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
};

const commands: any[] = [];
export const loadCommands = () => {
    commands.length = 0;

    const files = readdirSync(`${__dirname}/../commands/`).filter((x) => x.endsWith('.js')); // .ts

    for (let filename of files) {
        let file = require(`../commands/${filename}`);
        file.options ? commands.push(file.options) : null;
    }

    return commands;
};
