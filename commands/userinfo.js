const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');

// ฟังก์ชันจัดรูปแบบเวลา uptime
const formatUptime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs} ชม. ${mins} นาที ${secs} วินาที`;
};

// Logging error
const logError = (error, context) => {
  console.error(`❌ ERROR in ${context}:`);
  console.error(error.message || error);
  console.error(error.stack || '');
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('แสดงข้อมูลของบอทแบบ real-time'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const { client } = interaction;
      const botUser = client.user;
      const guildCount = client.guilds.cache.size;
      const userCount = client.users.cache.size;
      const ping = client.ws.ping;
      const uptime = client.uptime / 1000; // milliseconds to seconds

      // ดึงข้อมูลระบบ
      const [mem, cpu, disks] = await Promise.all([
        si.mem(),
        si.currentLoad(),
        si.fsSize().catch(() => []),
      ]);

      const totalRAM = (mem.total / 1024 / 1024 / 1024).toFixed(2);
      const usedRAM = ((mem.total - mem.available) / 1024 / 1024 / 1024).toFixed(2);
      const cpuUsage = cpu.currentLoad.toFixed(2);

      let diskUsed = 'ไม่ทราบ';
      let diskTotal = 'ไม่ทราบ';
      if (disks[0]) {
        diskUsed = (disks[0].used / 1024 / 1024 / 1024).toFixed(2);
        diskTotal = (disks[0].size / 1024 / 1024 / 1024).toFixed(2);
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`📊 ข้อมูลของบอท: ${botUser.username}`)
        .setThumbnail(botUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 ชื่อบอท', value: botUser.globalName || botUser.username, inline: true },
          { name: '📅 สร้างเมื่อ', value: `<t:${Math.floor(botUser.createdTimestamp / 1000)}:F>`, inline: true },
          { name: '📡 สถานะ', value: botUser.presence?.status ?? 'ไม่ออนไลน์', inline: true },
          { name: '🌐 เซิร์ฟเวอร์ที่อยู่', value: `${guildCount}`, inline: true },
          { name: '👥 ผู้ใช้รวม', value: `${userCount}`, inline: true },
          { name: '📶 Ping', value: `${ping} ms`, inline: true },
          { name: '⏱️ Uptime', value: formatUptime(uptime), inline: true },
          { name: '💾 RAM', value: `${usedRAM} GB / ${totalRAM} GB`, inline: true },
          { name: '🖥️ CPU', value: `${cpuUsage}%`, inline: true },
          { name: '📀 Disk', value: `${diskUsed} GB / ${diskTotal} GB`, inline: true },
        )
        .setTimestamp()
        .setFooter({
          text: 'ให้บริการโดยบอท Discord',
          iconURL: botUser.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logError(error, 'info command');
      await interaction.editReply({
        content: '❌ ไม่สามารถดึงข้อมูลบอทได้!',
        ephemeral: true,
      });
    }
  },
};
