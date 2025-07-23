const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('แบนผู้ใช้จากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการแบน')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการแบน'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่มีการระบุเหตุผล';

    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    const authorMember = interaction.member;

    // ป้องกันการแบนตัวเองหรือบอท
    if (targetUser.id === interaction.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนตัวเองได้', ephemeral: true });

    if (targetUser.id === interaction.client.user.id)
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนบอทได้', ephemeral: true });

    // ตรวจสอบว่าเป้าหมายอยู่ในเซิร์ฟเวอร์
    if (!targetMember)
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });

    // ตรวจสอบว่าแบนได้ไหม
    if (!targetMember.bannable)
      return interaction.reply({ content: '❌ ไม่สามารถแบนผู้ใช้นี้ได้ (อาจมีสิทธิ์สูงกว่าหรือบทบาทสูงกว่า)', ephemeral: true });

    // แบนผู้ใช้
    await targetMember.ban({ reason });

    // Embed log
    const banEmbed = new EmbedBuilder()
      .setTitle('🚫 ผู้ใช้ถูกแบนจากเซิร์ฟเวอร์')
      .setColor(0xFF3E3E)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '👤 ผู้ใช้', value: `${targetUser.tag} \`(${targetUser.id})\``, inline: false },
        { name: '📄 เหตุผล', value: reason, inline: false },
        { name: '🔨 ดำเนินการโดย', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();

    // ส่งไปยังห้อง log ถ้ามี
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs' || c.name.includes('log'));
    if (logChannel) {
      logChannel.send({ embeds: [banEmbed] }).catch(console.error);
    }

    // แจ้งผู้ใช้ว่าแบนสำเร็จ
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x22BB33)
          .setDescription(`✅ **${targetUser.tag}** ถูกแบนเรียบร้อยแล้ว\nเหตุผล: \`${reason}\``)
      ],
      ephemeral: true
    });
  }
};
