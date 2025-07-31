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

// 🪵 Logger
const logError = (error, context = 'Unknown') => {
  console.error(`\n${EMOJIS.ERROR} ERROR [${new Date().toISOString()}] [${context}]`);
  console.error(error);
};

// 📜 Load Commands
const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands');

  try {
    const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

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
          console.warn(`${EMOJIS.WARNING} Invalid command in "${file}": Missing name or execute`);
        }
      } catch (err) {
        logError(err, `Command load error: ${file}`);
      }
    }

    console.table(commands.map(cmd => ({ name: cmd.name, description: cmd.description })));
    return commands;

  } catch (err) {
    logError(err, `Failed to read command folder: ${commandsPath}`);
    return [];
  }
};

// 🛰️ Register Slash Commands
const registerCommands = async (commands) => {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`${EMOJIS.INFO} Registering ${commands.length} commands...`);
    await rest.put(
      guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`${EMOJIS.SUCCESS} Commands registered`);
  } catch (err) {
    logError(err, 'Slash command registration failed');
  }
};

// 🎮 Bot Status
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
};

// ✅ On Ready
client.once(Events.ClientReady, async () => {
  console.log(`${EMOJIS.SUCCESS} Bot is online as ${client.user.tag}`);

  try {
    const commands = await loadCommands();
    await registerCommands(commands);
    rotateStatus();
  } catch (err) {
    logError(err, 'Bot initialization failed');
  }
});

// ⚙️ Handle Interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: `${EMOJIS.ERROR} Command not found: \`${interaction.commandName}\``,
      ephemeral: true,
    });
    return;
  }

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
