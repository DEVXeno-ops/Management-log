const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

// ==========================
// ✅ CONFIG & CONSTANTS
// ==========================
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
  WARNING: '⚠️'
};

const LOG_CHANNEL_NAME = 'mod-logs';
const COOLDOWN_MS = 5000; // 5 วินาที (ป้องกันสแปม)

// ==========================
// ✅ LOGGER HELPER
// ==========================
function logEvent(type, message) {
  const time = new Date().toLocaleString();
  const types = {
    error: chalk.red(`[${time}] ${EMOJIS.ERROR} ${message}`),
    success: chalk.green(`[${time}] ${EMOJIS.SUCCESS} ${message}`),
    warn: chalk.yellow(`[${time}] ${EMOJIS.WARNING} ${message}`),
    info: chalk.blueBright(`[${time}] ${EMOJIS.LOGS} ${message}`)
  };
  console.log(types[type] || message);
}

// ==========================
// ✅ COOLDOWN TRACKER
// ==========================
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription(`${EMOJIS.LOGS} ดูช่องบันทึกการดูแลเซิร์ฟเวอร์ (${LOG_CHANNEL_NAME})`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .setDMPermission(false),

  async execute(interaction) {
    const userId = interaction.user.id;
    const userTag = `${interaction.user.tag} (${interaction.user.id})`;
    const guildName = `${interaction.guild?.name || 'Unknown Guild'} (${interaction.guild?.id || 'N/A'})`;

    logEvent('info', `Command /logs used by ${userTag} in ${guildName}`);

    // ✅ Check cooldown
    if (cooldowns.has(userId)) {
      const remaining = ((cooldowns.get(userId) + COOLDOWN_MS) - Date.now()) / 1000;
      if (remaining > 0) {
        return interaction.reply({
          content: `${EMOJIS.WARNING} กรุณารอสัก **${remaining.toFixed(1)} วินาที** ก่อนใช้อีกครั้ง`,
          ephemeral: true
        });
      }
    }
    cooldowns.set(userId, Date.now());

    try {
      await interaction.deferReply({ ephemeral: true });

      // ✅ Find channel dynamically
      const logChannel = interaction.guild.channels.cache.find(
        c => c.name.toLowerCase() === LOG_CHANNEL_NAME && c.isTextBased()
      );

      if (!logChannel) {
        logEvent('warn', `No ${LOG_CHANNEL_NAME} channel found in ${guildName}`);

        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(`${EMOJIS.ERROR} ไม่พบช่อง ${LOG_CHANNEL_NAME}`)
          .setDescription(`กรุณาสร้างช่องชื่อ \`${LOG_CHANNEL_NAME}\` ก่อนใช้งานคำสั่งนี้`)
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined
          });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // ✅ Success response
      logEvent('success', `Found ${LOG_CHANNEL_NAME} channel: ${logChannel.name} (${logChannel.id}) in ${guildName}`);

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`${EMOJIS.LOGS} ช่องบันทึกการดูแลเซิร์ฟเวอร์`)
        .setDescription(`คุณสามารถดูบันทึกได้ที่: ${logChannel}`)
        .addFields(
          { name: `${EMOJIS.CHANNEL} ชื่อช่อง`, value: `\`${logChannel.name}\``, inline: true },
          { name: `${EMOJIS.ID} Channel ID`, value: `\`${logChannel.id}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: `เรียกใช้โดย ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        });

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      logEvent('error', `Logs Command Error in ${guildName}: ${error.stack || error}`);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`${EMOJIS.ERROR} เกิดข้อผิดพลาด`)
        .setDescription('เกิดข้อผิดพลาดขณะดำเนินการคำสั่ง กรุณาลองใหม่ภายหลัง')
        .addFields({ name: 'รายละเอียดข้อผิดพลาด', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({
          text: interaction.guild?.name || 'Unknown Guild',
          iconURL: interaction.guild?.iconURL({ dynamic: true }) || undefined
        });

      try {
        await interaction.editReply({ embeds: [errorEmbed] });
      } catch (replyError) {
        logEvent('error', `Failed to send error embed: ${replyError.stack || replyError}`);
      }
    }
  }
};
