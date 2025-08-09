const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('แบนผู้ใช้จากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการแบน')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการแบน')
        .setMaxLength(512)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่มีการระบุเหตุผล';

    // Fetch member fresh (ไม่ใช้ cache) เพื่อความแม่นยำ
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    // ป้องกันการแบนตัวเองและแบนบอท
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนตัวเองได้', ephemeral: true });
    }
    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ คุณไม่สามารถแบนบอทได้', ephemeral: true });
    }

    // เช็คว่าผู้ใช้เป้าหมายยังอยู่ในเซิร์ฟเวอร์
    if (!targetMember) {
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });
    }

    // เช็คว่าสามารถแบนได้ไหม
    if (!targetMember.bannable) {
      return interaction.reply({ content: '❌ ไม่สามารถแบนผู้ใช้นี้ได้ (อาจมีสิทธิ์หรือบทบาทสูงกว่า)', ephemeral: true });
    }

    try {
      // ส่ง DM แจ้งเตือนก่อนแบน (ถ้าส่งไม่ได้ให้ผ่าน)
      await targetUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF3E3E)
            .setTitle('🚫 คุณถูกแบนจากเซิร์ฟเวอร์')
            .addFields(
              { name: '📌 เซิร์ฟเวอร์', value: interaction.guild.name, inline: false },
              { name: '📄 เหตุผล', value: reason, inline: false },
              { name: '🔨 ดำเนินการโดย', value: interaction.user.tag, inline: false }
            )
            .setTimestamp()
        ]
      }).catch(() => { /* ไม่ต้องแจ้ง error ถ้า DM ไม่ได้ */ });

      // ทำการแบน
      await targetMember.ban({ reason });

      // สร้าง Embed สำหรับ log
      const banEmbed = new EmbedBuilder()
        .setTitle('🚫 ผู้ใช้ถูกแบนจากเซิร์ฟเวอร์')
        .setColor(0xFF3E3E)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 ผู้ใช้', value: `${targetUser.tag} \`(${targetUser.id})\``, inline: false },
          { name: '📄 เหตุผล', value: reason, inline: false },
          { name: '🔨 ดำเนินการโดย', value: `${interaction.user.tag} \`(${interaction.user.id})\``, inline: false }
        )
        .setTimestamp();

      // ส่ง log เข้า channel ที่ชื่อใกล้เคียง mod-logs
      const logChannel = interaction.guild.channels.cache.find(c =>
        ['mod-logs', 'moderation-logs', 'logs'].some(name => c.name.includes(name))
      );
      if (logChannel && logChannel.isTextBased()) {
        logChannel.send({ embeds: [banEmbed] }).catch(console.error);
      }

      // ตอบกลับผู้สั่งงานว่าแบนสำเร็จ
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x22BB33)
            .setDescription(`✅ **${targetUser.tag}** ถูกแบนเรียบร้อยแล้ว\n📄 เหตุผล: \`${reason}\``)
        ],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Ban Command Error:', error);
      await interaction.reply({
        content: '❌ เกิดข้อผิดพลาด ไม่สามารถแบนผู้ใช้นี้ได้',
        ephemeral: true
      });
    }
  }
};
