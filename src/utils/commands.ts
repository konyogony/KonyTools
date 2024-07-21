import { readdirSync } from 'node:fs';

const commands: any[] = [];
export const loadCommands = () => {
    commands.length = 0;

    const files = readdirSync(`${__dirname}/../commands/`).filter((x) => x.endsWith('.ts'));

    for (let filename of files) {
        let file = require(`../commands/${filename}`);
        file.options ? commands.push({ ...file.options, integration_types: [1], contexts: [0, 1, 2] }) : null;
    }

    return commands;
};
