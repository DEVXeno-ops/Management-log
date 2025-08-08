const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('ปิดเสียงสมาชิกในเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('เลือกสมาชิกที่ต้องการปิดเสียง')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผล (ไม่บังคับ)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  cooldown: 10, // กำหนด cooldown 10 วินาที
  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'ไม่ได้ระบุเหตุผล';

    // ตรวจสอบว่ามีสมาชิกในเซิร์ฟเวอร์หรือไม่
    if (!member) {
      return interaction.reply({ content: '❌ ไม่พบสมาชิกนี้ในเซิร์ฟเวอร์', ephemeral: true });
    }

    // ป้องกันผู้ใช้ปิดเสียงตัวเองหรือบอท
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '⚠️ คุณไม่สามารถปิดเสียงตัวเองได้', ephemeral: true });
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: '⚠️ ไม่สามารถปิดเสียงบอทได้', ephemeral: true });
    }

    // ตรวจสอบว่าบอทมีสิทธิ์จัดการเสียงหรือไม่
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return interaction.reply({ content: '❌ บอทไม่มีสิทธิ์ Mute Members กรุณาตั้งสิทธิ์ให้บอท', ephemeral: true });
    }

    // ตรวจสอบว่าเป้าหมายอยู่ในช่องเสียงหรือไม่
    if (!member.voice.channel) {
      return interaction.reply({ content: `❌ สมาชิก ${member.user.tag} ไม่ได้อยู่ในช่องเสียง`, ephemeral: true });
    }

    try {
      await member.voice.setMute(true, reason);
      await interaction.reply(`✅ ปิดเสียงสมาชิก **${member.user.tag}** เรียบร้อยแล้ว\n**เหตุผล:** ${reason}`);
    } catch (error) {
      console.error('Mute command error:', error);
      await interaction.reply({ content: '❌ ไม่สามารถปิดเสียงสมาชิกนี้ได้ อาจเกิดข้อผิดพลาดหรือไม่มีสิทธิ์', ephemeral: true });
    }
  },
};
