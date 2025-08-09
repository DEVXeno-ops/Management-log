const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');

// ฟังก์ชันจัดรูปแบบเวลา uptime
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d} วัน ${h} ชม. ${m} นาที ${s} วินาที`;
};

// ฟังก์ชันจัดตัวเลขให้มีคอมม่า
const numFormat = new Intl.NumberFormat('en-US');

// Logging error
const logError = (error, context) => {
  console.error(`❌ ERROR in ${context}:`, error);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('📊 แสดงข้อมูลของบอทแบบ real-time'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const { client } = interaction;
      const botUser = client.user;

      const guildCount = client.guilds.cache.size;
      const userCount = client.users.cache.size;
      const ping = client.ws.ping;
      const uptime = client.uptime / 1000;

      // ดึงข้อมูลระบบ
      const [mem, cpu, cpuInfo, disks, procMem] = await Promise.all([
        si.mem(),
        si.currentLoad(),
        si.cpu(),
        si.fsSize().catch(() => []),
        si.processLoad(process.pid).catch(() => null)
      ]);

      const totalRAM = (mem.total / 1024 ** 3).toFixed(2);
      const usedRAM = ((mem.total - mem.available) / 1024 ** 3).toFixed(2);
      const processRAM = procMem?.memRss ? (procMem.memRss / 1024 ** 3).toFixed(2) : 'ไม่ทราบ';
      const cpuUsage = cpu.currentLoad.toFixed(2);

      // ดิสก์รวมทุกลูก
      let diskInfo = 'ไม่ทราบ';
      if (disks.length > 0) {
        const totalDisk = disks.reduce((sum, d) => sum + d.size, 0) / 1024 ** 3;
        const usedDisk = disks.reduce((sum, d) => sum + d.used, 0) / 1024 ** 3;
        diskInfo = `${usedDisk.toFixed(2)} GB / ${totalDisk.toFixed(2)} GB`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`🤖 ข้อมูลบอท: ${botUser.username}`)
        .setThumbnail(botUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 ชื่อบอท', value: botUser.globalName || botUser.username, inline: true },
          { name: '📅 สร้างเมื่อ', value: `<t:${Math.floor(botUser.createdTimestamp / 1000)}:F>`, inline: true },
          { name: '📡 สถานะ', value: botUser.presence?.status ?? 'ไม่ออนไลน์', inline: true },
          { name: '🌐 เซิร์ฟเวอร์ที่อยู่', value: numFormat.format(guildCount), inline: true },
          { name: '👥 ผู้ใช้รวม', value: numFormat.format(userCount), inline: true },
          { name: '📶 Ping', value: `${ping} ms`, inline: true },
          { name: '⏱️ Uptime', value: formatUptime(uptime), inline: false },
          { name: '💾 RAM (System)', value: `${usedRAM} GB / ${totalRAM} GB`, inline: true },
          { name: '📦 RAM (Bot)', value: `${processRAM} GB`, inline: true },
          { name: '🖥️ CPU', value: `${cpuInfo.manufacturer} ${cpuInfo.brand} (${cpuInfo.cores} Cores) - ${cpuUsage}% ใช้งาน`, inline: false },
          { name: '📀 Disk', value: diskInfo, inline: true },
          { name: '⚙️ Node.js', value: process.version, inline: true },
          { name: '📚 Discord.js', value: require('discord.js').version, inline: true }
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
