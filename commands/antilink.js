const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, saveGuildSettings } = require('../settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('เปิดหรือปิดระบบป้องกันลิงก์ในแชท'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    let settings = await getGuildSettings(guildId) || { antiLinkEnabled: false };

    // อัปเดตการตั้งค่า
    settings.antiLinkEnabled = !settings.antiLinkEnabled;

    // บันทึกการตั้งค่าของเซิร์ฟเวอร์
    await saveGuildSettings(guildId, settings);

    // สร้าง Embed ที่แจ้งผลการตั้งค่า
    const embed = new EmbedBuilder()
      .setColor(settings.antiLinkEnabled ? 0x00FF00 : 0xFF0000)
      .setTitle(`🔒 ระบบป้องกันลิงก์ ${settings.antiLinkEnabled ? '✅ เปิด' : '❌ ปิด'}`)
      .setDescription(`ระบบป้องกันลิงก์ในเซิร์ฟเวอร์นี้ได้ถูก ${settings.antiLinkEnabled ? 'เปิด' : 'ปิด'}.`)
      .setFooter({ text: 'การตั้งค่านี้มีผลทันที' })
      .setTimestamp();

    // ส่ง Embed กลับไปยังผู้ใช้
    await interaction.reply({ embeds: [embed] });
  },

  async messageCreate(message) {
    if (message.author.bot) return;

    const guildId = message.guild.id;
    let settings = await getGuildSettings(guildId);

    // หากระบบป้องกันลิงก์ไม่เปิดใช้งาน จะไม่ทำอะไร
    if (!settings?.antiLinkEnabled) return;

    // ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลหรือไม่
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return; // ไม่บล็อกลิงก์ถ้าผู้ใช้เป็นผู้ดูแล
    }

    // รูปแบบที่ใช้ตรวจสอบลิงก์ในข้อความ
    const urlPattern = /(https?:\/\/|ftp:\/\/|file:\/\/)[^\s]+/g;
    if (urlPattern.test(message.content)) {
      try {
        // ลบข้อความที่มีลิงก์
        await message.delete();

        // สร้าง Embed ที่แจ้งเตือนเกี่ยวกับการแชร์ลิงก์
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚫 ห้ามแชร์ลิงก์!')
          .setDescription(`@${message.author.tag}, การแชร์ลิงก์ในแชทนี้ถูกห้าม.`)
          .setFooter({ text: 'ห้ามแชร์ลิงก์ที่ไม่ได้รับอนุญาต' })
          .setTimestamp();

        // ส่งข้อความแจ้งเตือนกลับไป
        await message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อความ:', error);
      }
    }
  }
};
