import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const options = new SlashCommandBuilder()
    .setName('unwtf')
    .setDescription('Unwtf English -> Russian')
    .addStringOption((o) => o.setName('content').setDescription('Content to unwtf').setRequired(true))
    .toJSON();

export const run = async (interaction: ChatInputCommandInteraction<'cached'>) => {
    const wtfmsg = interaction.options.getString('content', true);
    const unwtf: String[] = [];
    type LanguageMap = {
        [key: string]: string;
    };
    const englishToRussian: LanguageMap = {
        q: 'й',
        w: 'ц',
        e: 'у',
        r: 'к',
        t: 'е',
        y: 'н',
        u: 'г',
        i: 'ш',
        o: 'щ',
        p: 'з',
        '[': 'х',
        ']': 'ъ',
        a: 'ф',
        s: 'ы',
        d: 'в',
        f: 'а',
        g: 'п',
        h: 'р',
        j: 'о',
        k: 'л',
        l: 'д',
        ';': 'ж',
        "'": 'э',
        z: 'я',
        x: 'ч',
        c: 'с',
        v: 'м',
        b: 'и',
        n: 'т',
        m: 'ь',
        ',': 'б',
        '.': 'ю',
        ' ': ' ',
    };
    wtfmsg.split('').forEach((letter) => {
        unwtf.push(englishToRussian[letter.toLowerCase()] || letter);
    });

    return await interaction.reply(unwtf.join(''));
};
