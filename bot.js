require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, Events, REST, Routes } = require('discord.js');
const fs = require('fs').promises; // Use promises for async file operations
const path = require('path');

// Centralized emoji configuration
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: 'ℹ️',
};

// 🌐 Validate environment variables
const { DISCORD_TOKEN: token, CLIENT_ID: clientId, GUILD_ID: guildId } = process.env;
if (!token || !clientId) {
  throw new Error(`${EMOJIS.ERROR} Missing DISCORD_TOKEN or CLIENT_ID in .env`);
}

// 🤖 Create Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
  ],
});

// 📁 Collections for commands
client.commands = new Collection();

// 🪵 Enhanced error logging with context
const logError = (error, context = '') => {
  console.error(`\n${EMOJIS.ERROR} ERROR [${new Date().toISOString()}]: ${context}`);
  console.error(error);
};

// 📜 Load Slash Commands
const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands');
  let commandFiles = [];
  try {
    commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));
  } catch (err) {
    logError(err, `Failed to read commands directory: ${commandsPath}`);
    return [];
  }

  const commands = [];
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      if (command?.data?.name && typeof command.execute === 'function') {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`${EMOJIS.SUCCESS} Loaded command: ${command.data.name}`);
      } else {
        console.warn(`${EMOJIS.WARNING} Invalid command in "${file}": Missing name or execute method`);
      }
    } catch (err) {
      logError(err, `Failed to load command: ${file}`);
    }
  }

  // Log loaded commands in a table
  console.table(commands.map(cmd => ({ name: cmd.name, description: cmd.description })));
  return commands;
};

// 📡 Register Slash Commands with Discord API
const registerCommands = async (commands) => {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log(`${EMOJIS.INFO} Registering ${commands.length} slash commands...`);
    await rest.put(
      guildId
        ? Routes.applicationGuildCommands(clientId, guildId) // Guild-specific commands
        : Routes.applicationCommands(clientId), // Global commands
      { body: commands }
    );
    console.log(`${EMOJIS.SUCCESS} Successfully registered ${commands.length} slash commands`);
  } catch (err) {
    logError(err, 'Failed to register slash commands');
  }
};

// 🎮 Rotate bot status every 30 seconds
const rotateStatus = () => {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: '/ban | /kick | /warn 🔨', type: ActivityType.Playing },
    { name: 'เสียงของชาว Discord 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันจัดอันดับ 🏆', type: ActivityType.Competing },
  ];

  let i = 0;
  setInterval(() => {
    try {
      client.user.setPresence({
        activities: [statuses[i]],
        status: 'online',
      });
      i = (i + 1) % statuses.length;
    } catch (err) {
      logError(err, 'Failed to update bot status');
    }
  }, 30_000);
};

// ✅ Event: Bot ready
client.once(Events.ClientReady, async () => {
  console.log(`${EMOJIS.SUCCESS} Bot online as: ${client.user.tag} (${client.user.id})`);

  try {
    const commands = await loadCommands();
    await registerCommands(commands);
    rotateStatus();
  } catch (err) {
    logError(err, 'Initialization failed');
  }
});

// 🧩 Event: Handle interactions (Slash Commands)
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: `${EMOJIS.ERROR} Command not found: ${interaction.commandName}`,
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logError(error, `Executing command: ${interaction.commandName}`);

    const errorMsg = `${EMOJIS.ERROR} เกิดข้อผิดพลาดในการใช้คำสั่งนี้ กรุณาลองใหม่ภายหลัง`;
    const replyOptions = { content: errorMsg, ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyOptions);
      } else {
        await interaction.reply(replyOptions);
      }
    } catch (followUpError) {
      logError(followUpError, 'Failed to send error message');
    }
  }
});

// 🚀 Start the bot
client.login(token).catch(error => {
  logError(error, 'Failed to login');
});
