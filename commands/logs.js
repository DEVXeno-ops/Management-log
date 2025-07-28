const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Centralized emoji configuration
const EMOJIS = {
  LOGS: '📜',
  ERROR: '❌',
  CHANNEL: '📌',
  ID: '🆔',
  SUCCESS: '✅',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription(`${EMOJIS.LOGS} ดูช่องบันทึกการดูแลเซิร์ฟเวอร์ (mod-logs)`)
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .setDMPermission(false), // Prevent command from being used in DMs

  async execute(interaction) {
    try {
      // Defer reply to handle potential processing time
      await interaction.deferReply({ ephemeral: true });

      // Find the mod-logs channel
      const logChannel = interaction.guild.channels.cache.find(
        c => c.name.toLowerCase() === 'mod-logs' && c.isTextBased()
      );

      // Check if channel exists
      if (!logChannel) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle(`${EMOJIS.ERROR} ไม่พบช่อง Mod-Logs`)
          .setDescription('กรุณาสร้างช่องชื่อ `mod-logs` ในเซิร์ฟเวอร์ก่อนใช้งานคำสั่งนี้')
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined,
          });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${EMOJIS.LOGS} ช่องบันทึกการดูแลเซิร์ฟเวอร์`)
        .setDescription(`คุณสามารถดูบันทึกการดูแลได้ที่: ${logChannel}`)
        .addFields(
          { name: `${EMOJIS.CHANNEL} ชื่อช่อง`, value: logChannel.name, inline: true },
          { name: `${EMOJIS.ID} Channel ID`, value: logChannel.id, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: `เรียกใช้โดย ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      // Send success response
      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      // Handle unexpected errors
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`${EMOJIS.ERROR} เกิดข้อผิดพลาด`)
        .setDescription('เกิดข้อผิดพลาดขณะดำเนินการคำสั่ง กรุณาลองใหม่ภายหลัง')
        .addFields({ name: 'ข้อผิดพลาด', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }) || undefined,
        });

      await interaction.editReply({ embeds: [errorEmbed] });
      console.error('Logs Command Error:', error);
    }
  },
};
