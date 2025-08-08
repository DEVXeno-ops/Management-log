const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('ปลดเสียงสมาชิกในเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('เลือกสมาชิกที่ต้องการปลดเสียง')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  cooldown: 10, // กำหนด cooldown 10 วินาที
  async execute(interaction) {
    const member = interaction.options.getMember('user');

    // ตรวจสอบว่ามีสมาชิกในเซิร์ฟเวอร์หรือไม่
    if (!member) {
      return interaction.reply({ content: '❌ ไม่พบสมาชิกนี้ในเซิร์ฟเวอร์', ephemeral: true });
    }

    // ป้องกันผู้ใช้ปลดเสียงตัวเองหรือบอท
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: '⚠️ คุณไม่สามารถปลดเสียงตัวเองได้', ephemeral: true });
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: '⚠️ ไม่สามารถปลดเสียงบอทได้', ephemeral: true });
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
      await member.voice.setMute(false);
      await interaction.reply(`✅ ปลดเสียงสมาชิก **${member.user.tag}** เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Unmute command error:', error);
      await interaction.reply({ content: '❌ ไม่สามารถปลดเสียงสมาชิกนี้ได้ อาจเกิดข้อผิดพลาดหรือไม่มีสิทธิ์', ephemeral: true });
    }
  },
};
