const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🚫 แบนผู้ใช้จากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการแบน')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการแบน')
        .setMaxLength(512)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่ได้ระบุเหตุผล';

    // Fetch member ใหม่เพื่อความแม่นยำ
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // ❌ ป้องกันการแบนตัวเองหรือบอท
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนตัวเองได้', ephemeral: true });
    }
    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนบอทได้', ephemeral: true });
    }
    if (!targetMember) {
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });
    }
    if (!targetMember.bannable) {
      return interaction.reply({ content: '❌ ไม่สามารถแบนผู้ใช้นี้ได้ (บทบาทสูงกว่า หรือสิทธิ์ไม่เพียงพอ)', ephemeral: true });
    }

    try {
      // ส่ง DM แจ้งเตือนก่อนแบน (ถ้าส่งไม่ได้จะไม่ error)
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF3E3E)
        .setTitle('🚫 คุณถูกแบนจากเซิร์ฟเวอร์')
        .addFields(
          { name: '📌 เซิร์ฟเวอร์', value: interaction.guild.name, inline: false },
          { name: '📄 เหตุผล', value: reason, inline: false },
          { name: '🔨 ดำเนินการโดย', value: interaction.user.tag, inline: false }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

      // แบนผู้ใช้
      await targetMember.ban({ reason });

      // Embed สำหรับ log
      const logEmbed = new EmbedBuilder()
        .setTitle('🚫 ผู้ใช้ถูกแบน')
        .setColor(0xFF3E3E)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 ผู้ใช้', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: false },
          { name: '📄 เหตุผล', value: reason, inline: false },
          { name: '🔨 ดำเนินการโดย', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: false }
        )
        .setTimestamp();

      // หา channel log ที่เหมาะสม
      const logChannel = interaction.guild.channels.cache.find(c =>
        c.isTextBased() &&
        ['mod-logs', 'moderation-logs', 'logs'].some(name => c.name.toLowerCase().includes(name))
      );
      if (logChannel) await logChannel.send({ embeds: [logEmbed] }).catch(console.error);

      // ตอบกลับผู้ใช้ที่สั่งงาน
      const replyEmbed = new EmbedBuilder()
        .setColor(0x22BB33)
        .setDescription(`✅ **${targetUser.tag}** ถูกแบนเรียบร้อยแล้ว\n📄 เหตุผล: \`${reason}\``);

      return interaction.reply({ embeds: [replyEmbed], ephemeral: true });

    } catch (error) {
      console.error('❌ Ban Command Error:', error);
      return interaction.reply({ content: '❌ เกิดข้อผิดพลาด ไม่สามารถแบนผู้ใช้นี้ได้', ephemeral: true });
    }
  }
};
