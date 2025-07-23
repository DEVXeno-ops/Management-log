require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🌐 ตรวจสอบ Token จาก .env
const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('❌ ไม่พบ DISCORD_TOKEN ในไฟล์ .env');

// 🤖 สร้างอินสแตนซ์ของ Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
  ],
});

// 📁 คอลเลกชันสำหรับเก็บคำสั่ง
client.commands = new Collection();

// 🪵 ระบบ log error พร้อม context
const logError = (error, context = '') => {
  console.error(`\n❌ ERROR: ${context}`);
  console.error(error);
};

// 📜 โหลด Slash Commands ทั้งหมด
const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.existsSync(commandsPath)
    ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    : [];

  const commands = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      if (command?.data?.name && typeof command.execute === 'function') {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ คำสั่งใน "${file}" ไม่สมบูรณ์หรือไม่มี method execute`);
      }
    } catch (err) {
      logError(err, `โหลดคำสั่งล้มเหลวใน "${file}"`);
    }
  }

  console.table(client.commands.map(cmd => cmd.data.toJSON()));
  return commands;
};

// 🎮 สถานะบอทแบบหมุนเวียนทุก 30 วิ
const rotateStatus = () => {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: '/ban | /kick | /warn 🔨', type: ActivityType.Playing },
    { name: 'เสียงของชาว Discord 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันจัดอันดับ 🏆', type: ActivityType.Competing },
  ];

  let i = 0;
  setInterval(() => {
    client.user.setPresence({
      activities: [statuses[i]],
      status: 'online'
    });
    i = (i + 1) % statuses.length;
  }, 30_000);
};

// ✅ Event: บอทพร้อมใช้งาน
client.once(Events.ClientReady, async () => {
  console.log(`✅ พร้อมใช้งานในฐานะ: ${client.user.tag}`);

  try {
    const commands = await loadCommands();
    await client.application.commands.set(commands);
    console.log(`📡 ลงทะเบียน Slash Commands สำเร็จ (${commands.length} รายการ)`);
  } catch (err) {
    logError(err, '❌ ล้มเหลวในการลงทะเบียนคำสั่ง');
  }

  rotateStatus();
});

// 🧩 Event: รับ Interaction (Slash Command)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logError(error, `คำสั่ง ${interaction.commandName}`);

    const errorMsg = '⚠️ เกิดข้อผิดพลาดในการใช้คำสั่งนี้';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

// 🚀 เริ่มต้นบอท
client.login(token).catch(error => {
  logError(error, 'ล้มเหลวในการล็อกอิน');
});
