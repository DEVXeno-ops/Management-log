const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('แสดงข้อมูลของเซิร์ฟเวอร์'),

  async execute(interaction) {
    try {
      const { guild, client } = interaction;

      // ดึงข้อมูลเจ้าของเซิร์ฟเวอร์
      const owner = await guild.fetchOwner();

      // ข้อมูลจำนวนสมาชิก
      await guild.members.fetch(); // ensure all members are cached
      const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
      const offlineMembers = guild.memberCount - onlineMembers;

      // ดึงข้อมูลช่อง
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;

      // Vanity URL (ใช้ fetch แทน direct property)
      let vanityURL = 'ไม่มี Vanity URL';
      try {
        const fetchedVanity = await guild.fetchVanityData();
        vanityURL = fetchedVanity.code ? `https://discord.gg/${fetchedVanity.code}` : vanityURL;
      } catch {}

      // Embed Message
      const serverInfoEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`📊 ข้อมูลของเซิร์ฟเวอร์`)
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .addFields(
          { name: '🧩 ชื่อเซิร์ฟเวอร์', value: guild.name, inline: true },
          { name: '👥 สมาชิกทั้งหมด', value: `${guild.memberCount}`, inline: true },
          { name: '🟢 ออนไลน์', value: `${onlineMembers}`, inline: true },
          { name: '⚪ ออฟไลน์', value: `${offlineMembers}`, inline: true },
          { name: '💬 ช่องข้อความ', value: `${textChannels}`, inline: true },
          { name: '🔊 ช่องเสียง', value: `${voiceChannels}`, inline: true },
          { name: '🎭 จำนวนโรล', value: `${guild.roles.cache.size}`, inline: true },
          { name: '📅 สร้างเมื่อ', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
          { name: '👑 เจ้าของเซิร์ฟเวอร์', value: `${owner.user.tag} (${owner})`, inline: true },
          { name: '📌 บทบาทสูงสุด', value: guild.roles.highest.name, inline: true },
          { name: '🔗 Vanity URL', value: vanityURL, inline: false }
        )
        .setFooter({ text: `Server ID: ${guild.id}`, iconURL: client.user.avatarURL() })
        .setTimestamp();

      await interaction.reply({
        embeds: [serverInfoEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในคำสั่ง serverinfo:', error);
      await interaction.reply({
        content: '❌ ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้ในขณะนี้!',
        ephemeral: true,
      });
    }
  },
};
