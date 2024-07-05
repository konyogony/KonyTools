import interactionHandler from '../utils/commands';
import type { Interaction } from 'discord.js';

export async function run(interaction: Interaction<'cached'>) {
    interactionHandler(interaction);
}
