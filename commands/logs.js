const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('ดูช่อง log ของ moderation')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

  async execute(interaction) {
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'mod-logs');
    if (!logChannel) {
      return interaction.reply({ content: '❌ ไม่พบช่องชื่อ `mod-logs` กรุณาสร้างก่อน', ephemeral: true });
    }

    await interaction.reply({
      content: `📄 คุณสามารถดู log ได้ที่: ${logChannel}`,
      ephemeral: true,
    });
  }
};
