const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('ยกเลิกการแบนผู้ใช้โดยใช้ UID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('User ID ของผู้ใช้ที่ต้องการยกเลิกการแบน')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // ให้เฉพาะผู้ที่มีสิทธิ์สามารถใช้คำสั่งได้

  async execute(interaction) {
    const userId = interaction.options.getString('userid');

    if (!userId || isNaN(userId)) {
      return interaction.reply({ content: '❌ กรุณาระบุ User ID ที่ถูกต้อง', ephemeral: true });
    }

    try {
      const bans = await interaction.guild.bans.fetch().catch(() => null);

      if (!bans) {
        return interaction.reply({ content: '⚠️ ไม่สามารถดึงข้อมูลผู้ใช้ที่ถูกแบนได้', ephemeral: true });
      }

      const bannedUser = bans.get(userId);
      if (!bannedUser) {
        return interaction.reply({ content: '❌ ไม่พบผู้ใช้ที่ถูกแบนด้วย ID ที่ระบุ', ephemeral: true });
      }

      // สร้างปุ่มเพื่อให้ผู้ใช้ยืนยันการยกเลิกการแบน
      const unbanButton = new ButtonBuilder()
        .setCustomId(`unban_confirm_${userId}`)
        .setLabel('✅ ยืนยันการยกเลิกการแบน')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(unbanButton);

      // ส่งข้อความให้ผู้ใช้ยืนยันการยกเลิกการแบน
      await interaction.reply({
        content: `คุณต้องการยกเลิกการแบนผู้ใช้ <@${userId}> หรือไม่? คลิกที่ปุ่มด้านล่างเพื่อยืนยัน`,
        components: [row],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error fetching bans:', error);
      interaction.reply({ content: '❌ เกิดข้อผิดพลาดในการยกเลิกการแบน', ephemeral: true });
    }
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('unban_confirm_')) {
      const userId = interaction.customId.split('_')[2];

      if (!userId || isNaN(userId)) {
        return interaction.reply({ content: '❌ ไม่สามารถดำเนินการได้เนื่องจาก User ID ไม่ถูกต้อง', ephemeral: true });
      }

      try {
        await interaction.guild.bans.remove(userId);
        await interaction.update({
          content: `✅ ยกเลิกการแบนผู้ใช้ <@${userId}> สำเร็จแล้ว!`,
          components: [],
          ephemeral: true
        });

      } catch (error) {
        console.error('Error unbanning user:', error);
        await interaction.update({
          content: '❌ เกิดข้อผิดพลาดในการยกเลิกการแบน โปรดตรวจสอบสิทธิ์ของบอท',
          components: [],
          ephemeral: true
        });
      }
    }
  },
};
