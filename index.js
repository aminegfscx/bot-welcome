const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences 
    ]
});

// الأمر المطلوب
const COMMAND = 'b!'; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.content.trim() !== COMMAND) return;
    if (!message.member.permissions.has('Administrator')) return;

    // إنشاء الأزرار للخيارات الثلاثة
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('broadcast_all').setLabel('📢 الكل (All)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('broadcast_online').setLabel('🟢 الأونلاين (Online)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('broadcast_offline').setLabel('⚫ الأوفلاين (Offline)').setStyle(ButtonStyle.Secondary)
    );

    const response = await message.reply({
        content: '🎛️ **الرجاء اختيار نوع البث المراد إرساله:**',
        components: [row]
    });

    // انتطار ضغط الزر من الشخص الذي كتب الأمر فقط
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000 // دقيقة واحدة للاختيار
    });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: '❌ هذا الأمر ليس لك.', ephemeral: true });
        }

        const targetType = interaction.customId; // معرفة أي زر تم ضغطه
        let targetLabel = targetType === 'broadcast_all' ? 'الكل' : targetType === 'broadcast_online' ? 'الأونلاين' : 'الأوفلاين';

        // طلب نص الرسالة من المسؤول
        await interaction.update({ content: `📝 ممتاز! اخترت البث لـ **${targetLabel}**.\nالآن قم بكتابة الرسالة التي تريد إرسالها في الشات هنا:`, components: [] });

        // تجميع الرسالة القادمة من نفس الشخص
        const messageCollector = message.channel.createMessageCollector({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 120000 // دقيقتين لكتابة الرسالة
        });

        messageCollector.on('collect', async (msg) => {
            const broadcastMessage = msg.content;
            await msg.reply('⏳ جاري جلب الأعضاء وبدء عملية البث الإذاعي الخاص بك...');

            try {
                const members = await message.guild.members.fetch();
                let successCount = 0;

                for (const [id, member] of members) {
                    if (member.user.bot) continue;

                    const status = member.presence?.status || 'offline';
                    const isOnline = ['online', 'idle', 'dnd'].includes(status);

                    if (targetType === 'broadcast_all' || 
                       (targetType === 'broadcast_online' && isOnline) || 
                       (targetType === 'broadcast_offline' && !isOnline)) {
                        
                        try {
                            await member.send(broadcastMessage);
                            successCount++;
                            await new Promise(resolve => setTimeout(resolve, 500)); // تأخير لنصف ثانية لتجنب الحظر
                        } catch (err) {
                            console.log(`تعذر الإرسال لـ ${member.user.tag}`);
                        }
                    }
                }

                await message.channel.send(`✅ **اكتمل البث!** تم الإرسال بنجاح إلى **${successCount}** عضو من فئة (${targetLabel}).`);
            } catch (error) {
                console.error(error);
                await message.channel.send('❌ حدث خطأ أثناء محاولة جلب الأعضاء أو البث.');
            }
        });
    });
});

client.login(process.env.DISCORD_TOKEN);
