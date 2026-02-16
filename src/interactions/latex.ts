import { Resvg } from '@resvg/resvg-js';
import { chat } from '@tanstack/ai';
import { createGeminiChat } from '@tanstack/ai-gemini';
import Bun from 'bun';
import consola from 'consola';
import {
    ApplicationIntegrationType,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    TextDisplayBuilder,
} from 'discord.js';
import MathJax from 'mathjax';
import { admins, parseError } from '@/utils';

const mjPromise = MathJax.init({
    loader: { load: ['input/tex', 'output/svg'] },
    svg: { fontCache: 'local' },
});

export const options = new SlashCommandBuilder()
    .setName('latex')
    .setDescription('Convert text to a rendered LaTeX formula image')
    .addStringOption((option) =>
        option.setName('text').setDescription('The text or math text to convert to LaTeX').setRequired(true),
    )
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts([InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel]);

export const run = async (interaction: ChatInputCommandInteraction) => {
    if (!Object.values(admins).includes(interaction.user.id)) {
        const unauthorized = new TextDisplayBuilder().setContent('You are not allowed to use this command');

        return interaction.reply({
            components: [unauthorized],
            flags:
                (interaction.context !== InteractionContextType.BotDM ? MessageFlags.Ephemeral : 0) |
                MessageFlags.IsComponentsV2,
        });
    }

    const input = interaction.options.getString('text', true);

    if (!Bun.env.GEMINI_API_KEY) return;

    consola.info(`latex: ${interaction.user.tag} converting "${input}"`);
    await interaction.deferReply();

    try {
        const stream = chat({
            adapter: createGeminiChat('gemini-2.5-flash', Bun.env.GEMINI_API_KEY),
            temperature: 0,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            content: [
                                'Convert the following text into a valid LaTeX math text. Return ONLY the raw LaTeX code, without any surrounding delimiters like $, $$, \\[, \\], or markdown code blocks.',
                                'If the input is already valid LaTeX, clean it up and return it as-is (without delimiters).',
                                'If the input is natural language describing a math text, convert it to the corresponding LaTeX.',
                                '',
                                `Input: ${input}`,
                            ].join('\n'),
                        },
                    ],
                },
            ],
        });

        let text = '';
        let error: string | null = null;

        for await (const chunk of stream) {
            if (chunk.type === 'TEXT_MESSAGE_CONTENT' && chunk.delta) text += chunk.delta;
            if (chunk.type === 'RUN_ERROR') error = parseError(chunk.error?.message || 'Unknown error');
        }

        text = text.trim();
        consola.info(`latex: produced "${text}"`);

        if (error || !text) {
            const message = error || 'Empty response';
            consola.warn(`latex: ${message}`);

            const empty = new TextDisplayBuilder().setContent(message);

            return interaction.editReply({
                components: [empty],
                flags: MessageFlags.IsComponentsV2,
            });
        }

        const mj = await mjPromise;
        const svgNode = mj.startup.adaptor.firstChild(mj.tex2svg(text, { display: true }));

        const padding = 200;
        const [x, y, w, h] = mj.startup.adaptor.getAttribute(svgNode, 'viewBox').split(' ').map(Number);
        mj.startup.adaptor.setAttribute(
            svgNode,
            'viewBox',
            `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`,
        );

        const resvg = new Resvg(mj.startup.adaptor.serializeXML(svgNode), {
            fitTo: { mode: 'width', value: 900 },
            background: 'white',
        });

        const attachment = new AttachmentBuilder(resvg.render().asPng(), { name: 'formula.png' });

        return await interaction.editReply({ files: [attachment] });
    } catch (err) {
        consola.error(`latex: ${err}`);

        const failed = new TextDisplayBuilder().setContent('Failed to render LaTeX text');

        return interaction.editReply({
            components: [failed],
            flags: MessageFlags.IsComponentsV2,
        });
    }
};
