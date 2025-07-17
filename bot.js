require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ตรวจสอบ Token ก่อนเริ่ม
const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('❌ ไม่พบ DISCORD_TOKEN ใน .env');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
  ],
});

client.commands = new Collection();

// Logging utility
const logError = (error, context = '') => {
  console.error(`\n❌ ERROR: ${context}`);
  console.error(error);
};

// โหลดคำสั่งทั้งหมด
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
        console.warn(`⚠️ คำสั่งใน "${file}" ไม่สมบูรณ์`);
      }
    } catch (err) {
      logError(err, `โหลดคำสั่งล้มเหลวใน "${file}"`);
    }
  }

  console.table(client.commands.map(cmd => cmd.data.toJSON()));
  return commands;
};

// ตั้งสถานะหมุนเวียน
const rotateStatus = () => {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: 'คำสั่งใหม่ 📜', type: ActivityType.Playing },
    { name: 'เสียงจากสมาชิก 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันบอท 🤖', type: ActivityType.Competing },
  ];

  let i = 0;
  setInterval(() => {
    client.user.setPresence({ activities: [statuses[i]], status: 'online' });
    i = (i + 1) % statuses.length;
  }, 30_000);
};

// จัดการ Event: Ready
client.once(Events.ClientReady, async () => {
  console.log(`✅ บอทออนไลน์แล้ว: ${client.user.tag}`);

  try {
    const commands = await loadCommands();
    await client.application.commands.set(commands);
    console.log(`✅ ลงทะเบียน Slash Commands สำเร็จ (${commands.length} รายการ)`);
  } catch (err) {
    logError(err, 'ล้มเหลวในการลงทะเบียนคำสั่ง');
  }

  rotateStatus();
});

// จัดการ Interaction (Slash Commands)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logError(error, `คำสั่ง ${interaction.commandName}`);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '⚠️ เกิดข้อผิดพลาดในการใช้คำสั่งนี้', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ เกิดข้อผิดพลาดในการใช้คำสั่งนี้', ephemeral: true });
    }
  }
});

// เริ่มบอท
client.login(token).catch((error) => {
  logError(error, 'ล้มเหลวในการล็อกอิน');
});
