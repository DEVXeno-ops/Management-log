const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('เตะผู้ใช้ออกจากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการเตะ')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการเตะ')
        .setMaxLength(512)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่มีการระบุเหตุผล';
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // ป้องกันเตะตัวเอง / เตะบอท
    if (targetUser.id === interaction.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถเตะตัวเองได้', ephemeral: true });

    if (targetUser.id === interaction.client.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถเตะบอทได้', ephemeral: true });

    // ตรวจสอบว่าผู้ใช้ยังอยู่ในเซิร์ฟเวอร์
    if (!targetMember)
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });

    // ตรวจสอบสิทธิ์การเตะ
    if (!targetMember.kickable)
      return interaction.reply({ content: '❌ ไม่สามารถเตะผู้ใช้นี้ได้ (สิทธิ์หรือบทบาทสูงกว่า)', ephemeral: true });

    try {
      // DM แจ้งผู้ถูกเตะ (ถ้าส่งได้)
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🚪 คุณถูกเตะออกจากเซิร์ฟเวอร์')
            .addFields(
              { name: '📌 เซิร์ฟเวอร์', value: interaction.guild.name, inline: false },
              { name: '📄 เหตุผล', value: reason, inline: false },
              { name: '🔨 ดำเนินการโดย', value: interaction.user.tag, inline: false }
            )
            .setTimestamp()
        ]
      }).catch(() => { /* ผู้ใช้ปิด DM */ });

      // เตะออกจากเซิร์ฟเวอร์
      await targetMember.kick(reason);

      // Embed log
      const kickEmbed = new EmbedBuilder()
        .setTitle('🦵 ผู้ใช้ถูกเตะออกจากเซิร์ฟเวอร์')
        .setColor(0xFFA500)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 ผู้ใช้', value: `${targetUser.tag} \`(${targetUser.id})\``, inline: false },
          { name: '📄 เหตุผล', value: reason, inline: false },
          { name: '🔨 ดำเนินการโดย', value: `${interaction.user.tag} \`(${interaction.user.id})\``, inline: false }
        )
        .setTimestamp();

      // ส่ง log เข้า mod-logs ถ้ามี
      const logChannel = interaction.guild.channels.cache.find(c =>
        ['mod-logs', 'moderation-logs', 'logs'].some(name => c.name.includes(name))
      );
      if (logChannel && logChannel.isTextBased()) {
        logChannel.send({ embeds: [kickEmbed] }).catch(console.error);
      }

      // แจ้งผู้สั่งว่าทำสำเร็จ
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x22BB33)
            .setDescription(`✅ **${targetUser.tag}** ถูกเตะเรียบร้อยแล้ว\n📄 เหตุผล: \`${reason}\``)
        ],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Kick Command Error:', error);
      await interaction.reply({
        content: '❌ เกิดข้อผิดพลาด ไม่สามารถเตะผู้ใช้นี้ได้',
        ephemeral: true
      });
    }
  }
};
