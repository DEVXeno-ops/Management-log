const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');

// ฟังก์ชั่นสำหรับการบันทึกข้อผิดพลาด
const logError = (error, context) => {
  console.error('❌ ข้อผิดพลาดเกิดขึ้น:', context);
  console.error('ข้อความผิดพลาด:', error.message);
  console.error('Stack trace:', error.stack);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('แสดงข้อมูลของบอทแบบ real-time'),

  async execute(interaction) {
    try {
      await interaction.deferReply(); // ป้องกัน interaction timeout

      // ดึงข้อมูลบอทและเซิร์ฟเวอร์
      const { user: bot, guilds, users, ws, uptime } = interaction.client;
      const guildCount = guilds.cache.size;
      const userCount = users.cache.size;
      const ping = ws.ping && !isNaN(ws.ping) ? `${ws.ping} ms` : 'ไม่สามารถดึงข้อมูล Ping';

      // ดึงข้อมูลระบบพร้อมกัน
      const [systemData, cpuLoad, diskData] = await Promise.all([
        si.mem().catch(err => { logError(err, 'ดึงข้อมูล RAM'); return {}; }),
        si.currentLoad().catch(err => { logError(err, 'ดึงข้อมูล CPU'); return { currentLoad: 0 }; }),
        si.fsSize().catch(err => { logError(err, 'ดึงข้อมูล Disk'); return []; }),
      ]);

      // คำนวณข้อมูลระบบ
      const totalRAM = (systemData.total / 1024 / 1024 / 1024).toFixed(2);
      const usedRAM = ((systemData.total - systemData.free) / 1024 / 1024 / 1024).toFixed(2);
      const diskUsed = (diskData[0]?.used / 1024 / 1024 / 1024).toFixed(2) || 'ไม่สามารถดึงข้อมูล';
      const diskTotal = (diskData[0]?.size / 1024 / 1024 / 1024).toFixed(2) || 'ไม่สามารถดึงข้อมูล';
      const cpuPercentage = cpuLoad.currentLoad.toFixed(2);

      // คำนวณเวลาที่บอทออนไลน์
      const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8); // HH:mm:ss

      // สร้าง Embed ข้อมูลบอท
      const botInfoEmbed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`ข้อมูลของบอท: ${bot.username}`)
        .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 ชื่อบอท', value: bot.globalName || bot.username, inline: true },
          { name: '📅 วันที่สมัคร', value: bot.createdAt.toISOString().split('T')[0], inline: true },
          { name: '💬 สถานะ', value: bot.presence?.status ?? 'ไม่ออนไลน์', inline: true },
          { name: '👥 จำนวนผู้ใช้', value: `${userCount}`, inline: true },
          { name: '🌐 จำนวนเซิร์ฟเวอร์', value: `${guildCount}`, inline: true },
          { name: '📶 Ping', value: ping, inline: true },
          { name: '⏱️ ออนไลน์มาแล้ว', value: uptimeFormatted, inline: true },
          { name: '💾 RAM Usage', value: `${usedRAM}GB / ${totalRAM}GB`, inline: true },
          { name: '🖥️ CPU Usage', value: `${cpuPercentage}%`, inline: true },
          { name: '📀 Disk Usage', value: `${diskUsed}GB / ${diskTotal}GB`, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: 'ข้อมูลจากบอท Discord',
          iconURL: bot.displayAvatarURL({ dynamic: true })
        });

      // ส่งข้อมูลไปยัง Discord
      await interaction.editReply({ embeds: [botInfoEmbed] });

    } catch (error) {
      logError(error, 'ไม่สามารถดึงข้อมูลบอท');
      await interaction.editReply({ content: '❌ ไม่สามารถดึงข้อมูลบอทได้!' });
    }
  },
};
