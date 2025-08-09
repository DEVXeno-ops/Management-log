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
const chalk = require('chalk');

// ===== CONSTANTS =====
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: 'ℹ️',
};

const { DISCORD_TOKEN: token, CLIENT_ID: clientId, GUILD_ID: guildId } = process.env;
if (!token || !clientId) {
  throw new Error(`${EMOJIS.ERROR} Missing DISCORD_TOKEN or CLIENT_ID in .env`);
}

// ===== CLIENT =====
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
const cooldowns = new WeakMap();

// ===== LOGGER =====
const log = {
  info: (msg) => console.log(chalk.blueBright(`${EMOJIS.INFO} ${msg}`)),
  success: (msg) => console.log(chalk.green(`${EMOJIS.SUCCESS} ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`${EMOJIS.WARNING} ${msg}`)),
  error: (err, ctx = 'Unknown') => {
    console.error(chalk.red(`\n${EMOJIS.ERROR} ERROR [${ctx}] @ ${new Date().toISOString()}`));
    console.error(err);
  },
};

// ===== ERROR HANDLERS =====
process.on('unhandledRejection', (reason) => log.error(reason, 'Unhandled Rejection'));
process.on('uncaughtException', (err) => log.error(err, 'Uncaught Exception'));

// ===== LOAD COMMANDS (recursive) =====
async function loadCommands(dir = path.join(__dirname, 'commands')) {
  let commands = [];

  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        const sub = await loadCommands(filePath);
        commands.push(...sub);
        continue;
      }

      if (!file.name.endsWith('.js')) continue;

      try {
        const command = require(filePath);
        if (command?.data?.name && typeof command.execute === 'function') {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
          log.success(`Loaded command: ${command.data.name}`);
        } else {
          log.warn(`Invalid command format in: ${file.name}`);
        }
      } catch (err) {
        log.error(err, `Command load error: ${file.name}`);
      }
    }
  } catch (err) {
    log.error(err, `Failed to read commands from: ${dir}`);
  }

  return commands;
}

// ===== REGISTER SLASH COMMANDS =====
async function registerCommands(commands) {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    log.info(`Registering ${commands.length} commands...`);
    await rest.put(
      guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId),
      { body: commands }
    );
    log.success(`Commands registered successfully`);
  } catch (err) {
    log.error(err, 'Slash command registration failed');
  }
}

// ===== BOT STATUS =====
function rotateStatus() {
  const statuses = [
    { name: 'เซิร์ฟเวอร์ของคุณ 🛡️', type: ActivityType.Watching },
    { name: '/ban | /kick | /warn 🔨', type: ActivityType.Playing },
    { name: 'เสียงของชาว Discord 🎧', type: ActivityType.Listening },
    { name: 'การแข่งขันจัดอันดับ 🏆', type: ActivityType.Competing },
  ];

  let i = 0;
  setImmediate(() => {
    setInterval(() => {
      if (!client.user) return;
      client.user.setPresence({ activities: [statuses[i]], status: 'online' });
      i = (i + 1) % statuses.length;
    }, 30_000);
  });
}

// ===== ON READY =====
client.once(Events.ClientReady, async () => {
  log.success(`Bot is online as ${client.user.tag}`);
  console.log(chalk.gray(`Started at: ${new Date().toLocaleString()}`));

  try {
    const commands = await loadCommands();
    if (commands.length) await registerCommands(commands);
    rotateStatus();
  } catch (err) {
    log.error(err, 'Bot initialization failed');
  }
});

// ===== INTERACTION HANDLER =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({
      content: `${EMOJIS.ERROR} Command not found: \`${interaction.commandName}\``,
      ephemeral: true,
    });
  }

  const now = Date.now();
  const cooldownTime = (command.cooldown || 3) * 1000;

  if (!cooldowns.has(interaction.user)) cooldowns.set(interaction.user, {});
  const userCooldowns = cooldowns.get(interaction.user);

  if (userCooldowns[interaction.commandName] && now < userCooldowns[interaction.commandName]) {
    const timeLeft = ((userCooldowns[interaction.commandName] - now) / 1000).toFixed(1);
    return interaction.reply({
      content: `${EMOJIS.WARNING} กรุณารออีก ${timeLeft} วินาที ก่อนใช้คำสั่งนี้`,
      ephemeral: true,
    });
  }

  userCooldowns[interaction.commandName] = now + cooldownTime;

  try {
    await command.execute(interaction);
  } catch (err) {
    log.error(err, `Executing command: ${interaction.commandName}`);
    const reply = {
      content: `${EMOJIS.ERROR} เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง`,
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// ===== LOGIN =====
client.login(token).catch((err) => log.error(err, 'Login failed'));
