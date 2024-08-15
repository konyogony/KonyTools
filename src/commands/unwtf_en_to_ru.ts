import { ApplicationCommandType, ContextMenuCommandBuilder, MessageContextMenuCommandInteraction } from 'discord.js';

export const options = new ContextMenuCommandBuilder()
    .setName('unwtf_en_to_ru')
    .setType(ApplicationCommandType.Message)
    .toJSON();

export const run = async (interaction: MessageContextMenuCommandInteraction<'cached'>) => {
    if (interaction.commandType !== ApplicationCommandType.Message) return;

    const englishToRussian: { [key: string]: string } = {
        q: 'й',
        Q: 'Й',
        w: 'ц',
        W: 'Ц',
        e: 'у',
        E: 'У',
        r: 'к',
        R: 'К',
        t: 'е',
        T: 'Е',
        y: 'н',
        Y: 'Н',
        u: 'г',
        U: 'Г',
        i: 'ш',
        I: 'Ш',
        o: 'щ',
        O: 'Щ',
        p: 'з',
        P: 'З',
        '[': 'х',
        '{': 'Х',
        ']': 'ъ',
        '}': 'Ъ',
        a: 'ф',
        A: 'Ф',
        s: 'ы',
        S: 'Ы',
        d: 'в',
        D: 'В',
        f: 'а',
        F: 'А',
        g: 'п',
        G: 'П',
        h: 'р',
        H: 'Р',
        j: 'о',
        J: 'О',
        k: 'л',
        K: 'Л',
        l: 'д',
        L: 'Д',
        ';': 'ж',
        ':': 'Ж',
        "'": 'э',
        '"': 'Э',
        z: 'я',
        Z: 'Я',
        x: 'ч',
        X: 'Ч',
        c: 'с',
        C: 'С',
        v: 'м',
        V: 'М',
        b: 'и',
        B: 'И',
        n: 'т',
        N: 'Т',
        m: 'ь',
        M: 'Ь',
        ',': 'б',
        '<': 'Б',
        '.': 'ю',
        '>': 'Ю',
        ' ': ' ',
    };

    return await interaction.reply(
        interaction.targetMessage.content
            .split('')
            .map((letter) => englishToRussian[letter] || letter)
            .join(''),
    );
};
