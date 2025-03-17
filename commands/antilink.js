const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildSettings, saveGuildSettings } = require('../settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('เปิดหรือปิดระบบป้องกันลิงก์ในแชท'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    let settings = await getGuildSettings(guildId) || { antiLinkEnabled: false };

    settings.antiLinkEnabled = !settings.antiLinkEnabled;
    await saveGuildSettings(guildId, settings);

    const embed = new EmbedBuilder()
      .setColor(settings.antiLinkEnabled ? 0x00FF00 : 0xFF0000)
      .setTitle(`🔒 ระบบป้องกันลิงก์ ${settings.antiLinkEnabled ? '✅ เปิด' : '❌ ปิด'}`)
      .setDescription(`ระบบป้องกันลิงก์ในเซิร์ฟเวอร์นี้ได้ถูก ${settings.antiLinkEnabled ? 'เปิด' : 'ปิด'}.`)
      .setFooter({ text: 'การตั้งค่านี้มีผลทันที' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async messageCreate(message) {
    if (message.author.bot) return;

    const guildId = message.guild.id;
    let settings = await getGuildSettings(guildId);
    if (!settings?.antiLinkEnabled) return;

    const allowedRoles = ['Admin', 'Moderator'];
    const guildOwner = await message.guild.fetchOwner();
    
    if (
      guildOwner.id === message.author.id ||
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.roles.cache.some(role => allowedRoles.includes(role.name))
    ) return;

    if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
      try {
        await message.delete();
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚫 ห้ามแชร์ลิงก์!')
          .setDescription(`@${message.author.tag}, การแชร์ลิงก์ในแชทนี้ถูกห้าม.`)
          .setFooter({ text: 'ห้ามแชร์ลิงก์ที่ไม่ได้รับอนุญาต' })
          .setTimestamp();
        
        await message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อความ:', error);
      }
    }
  },
};
