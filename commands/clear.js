const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('ลบข้อความทั้งหมดจากผู้ใช้ที่ระบุในทุกห้องแชทของเซิร์ฟเวอร์')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('ID ของสมาชิกที่ต้องการลบข้อความ')
        .setRequired(true) // กำหนดให้ผู้ใช้ต้องระบุ ID ของผู้ใช้
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // สิทธิ์การจัดการข้อความ

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const replyEmbed = new EmbedBuilder()
        .setColor(0xFF5733)
        .setTitle('❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้')
        .setDescription('คุณต้องมีสิทธิ์ "จัดการข้อความ" เพื่อใช้คำสั่งนี้')
        .setTimestamp();
      return await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
    }

    const userId = interaction.options.getString('userid');
    let totalDeleted = 0;

    try {
      await interaction.deferReply();  // เริ่มการตอบกลับ

      if (!interaction.guild) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF5733)
              .setTitle('❌ ข้อผิดพลาดในการเข้าถึงเซิร์ฟเวอร์')
              .setDescription('ไม่สามารถเข้าถึงข้อมูลของเซิร์ฟเวอร์ได้')
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      const targetUserId = userId === interaction.user.id ? interaction.user.id : userId;

      const channels = await interaction.guild.channels.fetch();
      const textChannels = channels.filter(channel => channel.isTextBased());

      if (textChannels.size === 0) {
        const noChannelsEmbed = new EmbedBuilder()
          .setColor(0xFF5733)
          .setTitle('❌ ไม่มีช่องแชทที่รองรับ')
          .setDescription('ไม่พบห้องแชทที่สามารถลบข้อความได้ในเซิร์ฟเวอร์นี้')
          .setTimestamp();
        return await interaction.editReply({ embeds: [noChannelsEmbed], ephemeral: true });
      }

      const deletePromises = textChannels.map(async (channel) => {
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          const userMessages = messages.filter(msg => msg.author.id === targetUserId);

          if (userMessages.size > 0) {
            const messagesToDelete = userMessages.map(msg => msg.id);
            while (messagesToDelete.length > 0) {
              const toDelete = messagesToDelete.slice(0, 100);
              await channel.bulkDelete(toDelete, true);
              totalDeleted += toDelete.length;
              messagesToDelete.splice(0, 100);
            }
            console.log(`ลบข้อความจาก ID ${targetUserId} ในช่องแชท ${channel.name}`);
          }
        } catch (error) {
          console.error(`เกิดข้อผิดพลาดในการดึงข้อความจาก ID ${targetUserId} ในช่องแชท ${channel.name}:`, error);
          await interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setColor(0xFF5733)
                .setTitle('❌ เกิดข้อผิดพลาด')
                .setDescription(`ไม่สามารถดึงข้อความจากช่องแชท ${channel.name}`)
                .setTimestamp()
            ],
            ephemeral: true
          });
        }
      });

      await Promise.all(deletePromises);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ การลบข้อความสำเร็จ')
            .setDescription(`ลบข้อความทั้งหมดจาก ID ${targetUserId} ในทุกห้องแชท\n\nจำนวนข้อความที่ลบ: ${totalDeleted} ข้อความ`)
            .setTimestamp()
        ],
        ephemeral: true
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบข้อความ:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF5733)
        .setTitle('❌ ข้อผิดพลาดในการลบข้อความ')
        .setDescription('เกิดข้อผิดพลาดในการลบข้อความจากทุกห้องแชท')
        .setTimestamp();
      
      // ใช้ followUp ในกรณีที่ต้องการส่งคำตอบเพิ่มเติม
      if (!interaction.replied) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
