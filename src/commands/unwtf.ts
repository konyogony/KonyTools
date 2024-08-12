import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('unwtf')
    .setType(ApplicationCommandType.Message)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;
    const wtfmsg = interaction.targetMessage;
    console.log(1);
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
    wtfmsg.content.split('').forEach((letter) => {
        console.log(2);
        unwtf.push(englishToRussian[letter.toLowerCase()] || letter);
    });
    console.log(3);
    return await interaction.reply(unwtf.join(''));
};
