const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const chalk = require('chalk');

const EMOJIS = {
  INFO: '📊',
  ERROR: '❌',
  OWNER: '👑',
  MEMBER: '👥',
  ONLINE: '🟢',
  OFFLINE: '⚪',
  BOT: '🤖',
  TEXT: '💬',
  VOICE: '🔊',
  ROLE: '🎭',
  CREATED: '📅',
  BOOST: '🚀',
  EMOJI: '😃',
  STICKER: '🏷️',
  REGION: '🌎',
  VERIFY: '✅',
  LINK: '🔗'
};

function logEvent(type, message) {
  const time = new Date().toLocaleString();
  if (type === 'error') console.error(chalk.red(`[${time}] ${EMOJIS.ERROR} ${message}`));
  else if (type === 'success') console.log(chalk.green(`[${time}] ✅ ${message}`));
  else console.log(chalk.blueBright(`[${time}] ℹ️ ${message}`));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription(`${EMOJIS.INFO} แสดงข้อมูลของเซิร์ฟเวอร์`),

  async execute(interaction) {
    const { guild, client, user } = interaction;
    logEvent('info', `/serverinfo used by ${user.tag} in ${guild.name} (${guild.id})`);

    try {
      const owner = await guild.fetchOwner();
      await guild.members.fetch(); // Cache สมาชิก

      // นับสมาชิก
      const totalMembers = guild.memberCount;
      const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online').size;
      const offlineMembers = totalMembers - onlineMembers;
      const botCount = guild.members.cache.filter(m => m.user.bot).size;

      // นับช่อง
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;

      // Vanity URL
      let vanityURL = 'ไม่มี';
      try {
        const vanity = await guild.fetchVanityData();
        if (vanity.code) vanityURL = `https://discord.gg/${vanity.code}`;
      } catch {}

      // Embed
      const serverInfoEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`${EMOJIS.INFO} ข้อมูลของเซิร์ฟเวอร์`)
        .setThumbnail(guild.iconURL({ size: 1024 }))
        .addFields(
          { name: `${EMOJIS.OWNER} เจ้าของเซิร์ฟเวอร์`, value: `${owner.user.tag} (${owner.id})`, inline: false },
          { name: `${EMOJIS.MEMBER} สมาชิกทั้งหมด`, value: `${totalMembers}`, inline: true },
          { name: `${EMOJIS.ONLINE} ออนไลน์`, value: `${onlineMembers}`, inline: true },
          { name: `${EMOJIS.OFFLINE} ออฟไลน์`, value: `${offlineMembers}`, inline: true },
          { name: `${EMOJIS.BOT} บอท`, value: `${botCount}`, inline: true },
          { name: `${EMOJIS.TEXT} ช่องข้อความ`, value: `${textChannels}`, inline: true },
          { name: `${EMOJIS.VOICE} ช่องเสียง`, value: `${voiceChannels}`, inline: true },
          { name: `${EMOJIS.ROLE} จำนวนโรล`, value: `${guild.roles.cache.size}`, inline: true },
          { name: `${EMOJIS.BOOST} Boost`, value: `ระดับ ${guild.premiumTier} (${guild.premiumSubscriptionCount} ครั้ง)`, inline: true },
          { name: `${EMOJIS.EMOJI} อีโมจิ`, value: `${guild.emojis.cache.size}`, inline: true },
          { name: `${EMOJIS.STICKER} สติกเกอร์`, value: `${guild.stickers.cache.size}`, inline: true },
          { name: `${EMOJIS.REGION} ภาษา/ภูมิภาค`, value: `${guild.preferredLocale}`, inline: true },
          { name: `${EMOJIS.VERIFY} ระดับการยืนยัน`, value: `${guild.verificationLevel}`, inline: true },
          { name: `${EMOJIS.CREATED} สร้างเมื่อ`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
          { name: `${EMOJIS.LINK} Vanity URL`, value: vanityURL, inline: false }
        )
        .setFooter({ text: `Server ID: ${guild.id}`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [serverInfoEmbed], ephemeral: true });
      logEvent('success', `Server info sent for ${guild.name} (${guild.id})`);

    } catch (error) {
      logEvent('error', `Error in /serverinfo: ${error.stack || error}`);
      await interaction.reply({
        content: `${EMOJIS.ERROR} ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้ในขณะนี้!`,
        ephemeral: true
      });
    }
  },
};
