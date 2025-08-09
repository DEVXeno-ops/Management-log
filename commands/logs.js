const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

// Centralized emojis
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
};

// Logger helper
function logEvent(type, message) {
  const time = new Date().toLocaleString();
  if (type === 'error') {
    console.error(chalk.red(`[${time}] ${EMOJIS.ERROR} ${message}`));
  } else if (type === 'success') {
    console.log(chalk.green(`[${time}] ${EMOJIS.SUCCESS} ${message}`));
  } else if (type === 'warn') {
    console.log(chalk.yellow(`[${time}] ${EMOJIS.WARNING} ${message}`));
  } else {
    console.log(chalk.blueBright(`[${time}] ${EMOJIS.LOGS} ${message}`));
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription(`${EMOJIS.LOGS} ดูช่องบันทึกการดูแลเซิร์ฟเวอร์ (mod-logs)`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .setDMPermission(false),

  async execute(interaction) {
    const userTag = `${interaction.user.tag} (${interaction.user.id})`;
    const guildName = `${interaction.guild?.name || 'Unknown Guild'} (${interaction.guild?.id || 'N/A'})`;

    logEvent('info', `Command /logs started by ${userTag} in ${guildName}`);

    try {
      await interaction.deferReply({ ephemeral: true });

      // Find channel
      const logChannel = interaction.guild.channels.cache.find(
        c => c.name.toLowerCase() === 'mod-logs' && c.isTextBased()
      );

      if (!logChannel) {
        logEvent('warn', `No mod-logs channel found in ${guildName}`);

        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle(`${EMOJIS.ERROR} ไม่พบช่อง Mod-Logs`)
          .setDescription('กรุณาสร้างช่องชื่อ `mod-logs` ก่อนใช้งานคำสั่งนี้')
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined,
          });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Channel found
      logEvent('success', `Found mod-logs channel: ${logChannel.name} (${logChannel.id}) in ${guildName}`);

      const successEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`${EMOJIS.LOGS} ช่องบันทึกการดูแลเซิร์ฟเวอร์`)
        .setDescription(`คุณสามารถดูบันทึกได้ที่: ${logChannel.toString()}`)
        .addFields(
          { name: `${EMOJIS.CHANNEL} ชื่อช่อง`, value: logChannel.name, inline: true },
          { name: `${EMOJIS.ID} Channel ID`, value: logChannel.id, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: `เรียกใช้โดย ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      logEvent('error', `Logs Command Error in ${guildName}: ${error.stack || error}`);

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`${EMOJIS.ERROR} เกิดข้อผิดพลาด`)
        .setDescription('เกิดข้อผิดพลาดขณะดำเนินการคำสั่ง กรุณาลองใหม่ภายหลัง')
        .addFields({ name: 'รายละเอียดข้อผิดพลาด', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({
          text: interaction.guild?.name || 'Unknown Guild',
          iconURL: interaction.guild?.iconURL({ dynamic: true }) || undefined,
        });

      try {
        await interaction.editReply({ embeds: [errorEmbed] });
      } catch (replyError) {
        logEvent('error', `Failed to send error embed: ${replyError.stack || replyError}`);
      }
    }
  },
};
