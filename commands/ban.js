const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('แบนผู้ใช้จากเซิร์ฟเวอร์')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('ผู้ใช้ที่ต้องการแบน')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('เหตุผลในการแบน'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'ไม่มีการระบุเหตุผล';

    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      return interaction.reply({ content: '❌ ไม่พบผู้ใช้นี้ในเซิร์ฟเวอร์', ephemeral: true });
    }

    if (!member.bannable) {
      return interaction.reply({ content: '❌ ไม่สามารถแบนผู้ใช้นี้ได้', ephemeral: true });
    }

    await member.ban({ reason });

    const embed = new EmbedBuilder()
      .setTitle('⛔ ผู้ใช้ถูกแบน')
      .setColor(0xFF0000)
      .addFields(
        { name: '👤 ผู้ใช้', value: `${target.tag} (${target.id})` },
        { name: '📄 เหตุผล', value: reason },
        { name: '👮 โดย', value: `${interaction.user.tag}` }
      )
      .setTimestamp();

    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs');
    if (logChannel) logChannel.send({ embeds: [embed] });

    await interaction.reply({ content: `✅ แบน ${target.tag} แล้ว`, ephemeral: true });
  }
};
