import 'dotenv/config';

export default {
    token: process.env['DISCORD_TOKEN']!,
    client_id: process.env['CLIENT_ID']!,
    faceit_key: process.env['FACEIT_KEY']!,
    steam_key: process.env['STEAM_KEY']!,
    kony_id: process.env['KONY_ID']!,
};
