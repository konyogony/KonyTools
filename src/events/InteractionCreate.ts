import interactionHandler from '../handlers/';
import type { Interaction } from 'discord.js';

export async function run(interaction: Interaction<'cached'>) {
    interactionHandler(interaction);
}
