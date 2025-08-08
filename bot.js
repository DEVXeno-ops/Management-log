require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
  Events,
  REST,
  Routes
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// ✅ Emojis
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: 'ℹ️',
};

// 🌐 ENV check
const { DISCORD_TOKEN: token, CLIENT_ID: clientId, GUILD_ID: guildId } = process.env;
if (!token || !clientId) {
  throw new Error(`${EMOJIS.ERROR} Missing DISCORD_TOKEN or CLIENT_ID in .env`);
}

// 🤖 Client
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

// ⏳ Map เก็บ cooldown (key: 'userId-commandName', value: timestamp หมด cooldown)
const cooldowns = new Map();

// 🪵 Logger
const logError = (error, context = 'Unknown') => {
  console.error(`\n${EMOJIS.ERROR} ERROR [${new Date().toISOString()}] [${context}]`);
  console.error(error);
};

// 📜 Load Commands
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  let commands = [];

  try {
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = require(filePath);

        if (command?.data?.name && typeof command.execute === 'function') {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
          console.log(`${EMOJIS.SUCCESS} Loaded command: ${command.data.name}`);
        } else {
          console.warn(`${EMOJIS.WARNING} Invalid command in "${file}"`);
        }
      } catch (err) {
        logError(err, `Command load error: ${file}`);
      }
    }

    if (commands.length > 0) {
      console.table(commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description || 'No description'
      })));
    } else {
      console.warn(`${EMOJIS.WARNING} No valid commands found in "commands" folder`);
    }

    return commands;
  } catch (err) {
    logError(err, `Failed to read command folder: ${commandsPath}`);
    return [];
  }
}

// 🛰️ Register Slash Commands
async function registerCommands(commands) {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`${EMOJIS.INFO} Registering ${commands.length} commands...`);
    await rest.put(
      guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`${EMOJIS.SUCCESS} Commands registered successfully`);
  } catch (err) {
    logError(err, 'Slash command registration failed');
  }
}

// 🎮 Bot Status Rotation
function rotateStatus() {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: '/ban | /kick | /warn 🔨', type: ActivityType.Playing },
    { name: 'เสียงของชาว Discord 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันจัดอันดับ 🏆', type: ActivityType.Competing },
  ];

  let i = 0;
  setInterval(() => {
    try {
      if (client.user) {
        client.user.setPresence({
          activities: [statuses[i]],
          status: 'online',
        });
        i = (i + 1) % statuses.length;
      }
    } catch (err) {
      logError(err, 'Status rotation error');
    }
  }, 30_000);
}

// ✅ On Ready
client.once(Events.ClientReady, async () => {
  console.log(`${EMOJIS.SUCCESS} Bot is online as ${client.user.tag}`);

  try {
    const commands = await loadCommands();
    if (commands.length > 0) {
      await registerCommands(commands);
    }
    rotateStatus();
  } catch (err) {
    logError(err, 'Bot initialization failed');
  }
});

// ⚙️ Handle Interactions with Cooldown system
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} Command not found: \`${interaction.commandName}\``,
      ephemeral: true,
    });
  }

  // กำหนด cooldown (วินาที) ถ้า command ไม่ได้กำหนด ให้ใช้ 3 วินาทีเป็นดีฟอลต์
  const cooldownAmount = (command.cooldown || 3) * 1000;

  const now = Date.now();
  const cooldownKey = `${interaction.user.id}-${interaction.commandName}`;
  const expireTime = cooldowns.get(cooldownKey) || 0;

  if (now < expireTime) {
    const timeLeft = ((expireTime - now) / 1000).toFixed(1);
    return interaction.reply({
      content: `${EMOJIS.WARNING} กรุณารอสักครู่ ${timeLeft} วินาที ก่อนใช้คำสั่งนี้อีกครั้ง`,
      ephemeral: true,
    });
  }

  // ตั้งเวลา cooldown ใหม่
  cooldowns.set(cooldownKey, now + cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (err) {
    logError(err, `Executing command: ${interaction.commandName}`);

    const replyMsg = {
      content: `${EMOJIS.ERROR} เกิดข้อผิดพลาดขณะใช้งานคำสั่ง กรุณาลองใหม่ภายหลัง`,
      ephemeral: true,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyMsg);
      } else {
        await interaction.reply(replyMsg);
      }
    } catch (sendErr) {
      logError(sendErr, 'Failed to respond to interaction error');
    }
  }
});

// 🚀 Login
client.login(token).catch(error => logError(error, 'Login failed'));
