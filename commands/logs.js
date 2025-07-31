const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Centralized emojis
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
    .setDMPermission(false),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const logChannel = interaction.guild.channels.cache.find(
        c => c.name.toLowerCase() === 'mod-logs' && c.isTextBased()
      );

      if (!logChannel) {
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle(`${EMOJIS.ERROR} ไม่พบช่อง Mod-Logs`)
          .setDescription('กรุณาสร้างช่องชื่อ `mod-logs` ก่อนใช้งานคำสั่งนี้')
          .setTimestamp()
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL({ dynamic: true }) || null,
          });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

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
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`${EMOJIS.ERROR} เกิดข้อผิดพลาด`)
        .setDescription('เกิดข้อผิดพลาดขณะดำเนินการคำสั่ง กรุณาลองใหม่ภายหลัง')
        .addFields({ name: 'รายละเอียดข้อผิดพลาด', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp()
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }) || null,
        });

      await interaction.editReply({ embeds: [errorEmbed] });
      console.error('[❌] Logs Command Error:', error);
    }
  },
};
