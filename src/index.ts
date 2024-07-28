import { readdirSync } from 'node:fs';
import { ActivityType, Client, EmbedBuilder, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import { connection, Reminder, ReminderSchema } from './database';
import config from './utils/config';

const client = new Client({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions],
});

client.once('ready', async () => {
    if (!client.user) return;

    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity({
        name: `Bot ready for use!`,
        type: ActivityType.Custom,
        state: '',
    });
});

const eventFiles = readdirSync(`${__dirname}/events/`).filter((x) => x.endsWith('.ts'));
for (const filename of eventFiles) {
    const file = require(`./events/${filename}`);
    const name = filename.split('.')[0]!;
    if (file.once) {
        client.once(name, file.run);
    } else {
        client.on(name, file.run);
    }
}

client.on('error', console.error);

connection
    .then(() => client.login(config.token))
    .catch((e: any) => {
        console.error(e);
        process.exit();
    });

cron.schedule('* * * * *', async () => {
    const reminders = await Reminder.find({ time: Math.floor(new Date().getTime() / 1000 / 60) });
    reminders.forEach(async (reminder) => {
        const user = await client.users.fetch(reminder.user_id);
        const embed = new EmbedBuilder()
            .setTitle('Reminder')
            .setDescription(reminder.content)
            .setColor('#4f9400')
            .setTimestamp(reminder.time_created);

        await user.send({ embeds: [embed] }).catch(() => void 0);
        await Reminder.deleteOne(reminder as ReminderSchema);
    });

    const old_reminders = await Reminder.find();
    old_reminders.forEach(async (reminder) => {
        console.log(reminder);
        if (Math.floor(new Date().getTime() / 1000 / 60) > reminder.time) {
            console.log('here');
            await reminder.delete(reminder as ReminderSchema);
        }
    });
});
