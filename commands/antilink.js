const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildSettings, saveGuildSettings } = require('../settings');  // นำเข้าฟังก์ชันจาก settings.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('เปิดหรือปิดการป้องกันลิงค์ในแชท'),

  // คำสั่งเปิด/ปิดระบบ
  async execute(interaction) {
    const guildId = interaction.guild.id;
    let settings = await getGuildSettings(guildId);

    // หากยังไม่มีการตั้งค่าให้ตั้งค่าพื้นฐาน
    if (!settings) {
      settings = { antiLinkEnabled: false };
      await saveGuildSettings(guildId, settings);
    }

    // สลับสถานะการป้องกันลิงค์
    settings.antiLinkEnabled = !settings.antiLinkEnabled;
    await saveGuildSettings(guildId, settings);

    const status = settings.antiLinkEnabled ? 'เปิด' : 'ปิด';
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(`✅ ระบบป้องกันลิงค์ ${status}`)
      .setDescription(`ระบบป้องกันลิงค์ในเซิร์ฟเวอร์นี้ได้ถูก ${status}.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  // Event to handle incoming messages and delete links
  async messageCreate(message) {
    // ตรวจสอบว่าเป็นข้อความจากบอทหรือไม่
    if (message.author.bot) return;

    const guildId = message.guild.id;
    let settings = await getGuildSettings(guildId);

    // ตรวจสอบว่าการป้องกันลิงก์เปิดใช้งานหรือไม่
    if (settings && settings.antiLinkEnabled) {
      // ใช้ regex ตรวจสอบลิงก์
      const urlRegex = /(https?|ftp|file|www)\S+/g;  // Regex สำหรับลิงก์ทุกรูปแบบ

      if (urlRegex.test(message.content)) {
        // ลบข้อความที่มีลิงก์
        await message.delete();

        // แจ้งเตือนผู้ใช้ที่พยายามส่งลิงก์
        await message.channel.send(
          `${message.author}, การแชร์ลิงก์ในแชทไม่อนุญาต!`
        );
      }
    }
  },
};
