const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('เตะผู้ใช้ออกจากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการเตะ')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการเตะ'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่มีการระบุเหตุผล';
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    // ป้องกันเตะตัวเอง/เตะบอท
    if (targetUser.id === interaction.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถเตะตัวเองได้', ephemeral: true });

    if (targetUser.id === interaction.client.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถเตะบอทได้', ephemeral: true });

    // ตรวจสอบว่าอยู่ในเซิร์ฟเวอร์
    if (!targetMember)
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });

    // ตรวจสอบว่าเตะได้ไหม
    if (!targetMember.kickable)
      return interaction.reply({ content: '❌ ไม่สามารถเตะผู้ใช้นี้ได้ (อาจมีสิทธิ์สูงกว่าหรือบทบาทสูงกว่า)', ephemeral: true });

    // เตะ
    await targetMember.kick(reason);

    // Embed log
    const kickEmbed = new EmbedBuilder()
      .setTitle('🦵 ผู้ใช้ถูกเตะออกจากเซิร์ฟเวอร์')
      .setColor(0xFFA500)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '👤 ผู้ใช้', value: `${targetUser.tag} \`(${targetUser.id})\``, inline: false },
        { name: '📄 เหตุผล', value: reason, inline: false },
        { name: '🔨 ดำเนินการโดย', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();

    // ส่งเข้า mod-logs ถ้ามี
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs' || c.name.includes('log'));
    if (logChannel) {
      logChannel.send({ embeds: [kickEmbed] }).catch(console.error);
    }

    // แจ้งเตะสำเร็จ
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x22BB33)
          .setDescription(`✅ **${targetUser.tag}** ถูกเตะเรียบร้อยแล้ว\nเหตุผล: \`${reason}\``)
      ],
      ephemeral: true
    });
  }
};
