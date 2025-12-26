import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction, AttachmentBuilder } from 'discord.js';
import MathJax from 'mathjax';
import { Resvg } from '@resvg/resvg-js';

const mjPromise = MathJax.init({
    loader: { load: ['input/tex', 'output/svg'] },
    svg: { fontCache: 'local' }
});

export const options = new ContextMenuCommandBuilder()
    .setName('latex')
    .setType(ApplicationCommandType.Message)
    .setIntegrationTypes(1)
    .setContexts(0, 1, 2)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;
    const expr = interaction.targetMessage.content;
    if (!expr) {
        interaction.reply({ content: 'No expression provided', ephermal: true });
    }

    await interaction.deferReply();

    try {
        const mj = await mjPromise;
        const node = mj.tex2svg(expr, { display: true });
        const svgString = mj.startup.adaptor.serializeXML(node);

        const resvg = new Resvg(svgString, {
            fitTo: { mode: 'width', value: 900 },
            background: 'white'
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        const attachement = new AttachementBuilder(pngBuffer, { name: 'formula.png '});
        return await interaction.editReply({ files: [attachement] });

    } catch (err) {
        console.log(err);
        return await interaction.editReply("Error rendering")
    }
};
