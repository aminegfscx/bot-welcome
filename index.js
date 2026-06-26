const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = '!';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages or messages without the correct prefix
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Broadcast command: !broadcast <message>
    if (command === 'broadcast') {
        // Ensure only server administrators can broadcast
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const broadcastMessage = args.join(' ');
        if (!broadcastMessage) {
            return message.reply('❌ Please provide a message to broadcast. Usage: `!broadcast <your message>`');
        }

        let sentCount = 0;

        // Iterate through all text channels the bot can see in the server
        message.guild.channels.cache.forEach((channel) => {
            if (channel.isTextBased()) {
                channel.send(broadcastMessage)
                    .then(() => sentCount++)
                    .catch(err => console.error(`Could not send to ${channel.name}:`, err.message));
            }
        });

        await message.reply(`📢 Broadcast sent to available channels successfully!`);
    }
});

client.login(process.env.MTUxNzYyOTI5NTM3NDEwNjc0NQ.GXzbUV.qV5T-srpw6Ct3eaAogIXv5nvjr_cqb6giboLwI);
