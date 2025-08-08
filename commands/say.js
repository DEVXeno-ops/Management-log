const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('ให้บอทพูดข้อความที่กำหนด')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('ข้อความที่ต้องการให้บอทพูด')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5, // cooldown 5 วินาที
  async execute(interaction) {
    const message = interaction.options.getString('message');

    // ตรวจสอบความยาวข้อความไม่เกิน 2000 ตัวอักษร (Discord limit)
    if (message.length > 2000) {
      return interaction.reply({
        content: '❌ ข้อความยาวเกิน 2000 ตัวอักษร กรุณาลดข้อความลง',
        ephemeral: true,
      });
    }

    try {
      // ตอบกลับผู้ใช้แบบลับ เพื่อไม่ให้แชทรก
      await interaction.reply({ content: '✅ ส่งข้อความเรียบร้อย', ephemeral: true });

      // ส่งข้อความลงช่องที่ใช้คำสั่ง
      await interaction.channel.send(message);
    } catch (error) {
      console.error('Say command error:', error);
      await interaction.reply({
        content: '❌ เกิดข้อผิดพลาดขณะส่งข้อความ โปรดลองอีกครั้งภายหลัง',
        ephemeral: true,
      });
    }
  },
};
