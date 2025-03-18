const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('เชิญบอทไปยังเซิร์ฟเวอร์ของคุณหรือเชิญสมาชิกเข้าร่วมเซิร์ฟเวอร์'),

  async execute(interaction) {
    // URL สำหรับเชิญบอท
    const botInviteLink = 'https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&scope=bot&permissions=YOUR_BOT_PERMISSIONS';
    
    // สร้าง Embed สำหรับแสดงผล
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎉 เชิญบอท!')
      .setDescription(`คุณสามารถเชิญบอทไปยังเซิร์ฟเวอร์ของคุณโดยคลิกที่ปุ่มด้านล่าง!`)
      .setTimestamp();
    
    // สร้างปุ่มที่เชื่อมโยงไปยังลิงค์เชิญ
    const inviteButton = new ButtonBuilder()
      .setLabel('เชิญบอท')
      .setStyle(ButtonStyle.Link)
      .setURL(botInviteLink);

    // ส่ง Embed พร้อมปุ่มให้ผู้ใช้ (แสดงเฉพาะผู้ใช้ที่ใช้งานคำสั่ง)
    await interaction.reply({
      embeds: [embed],
      components: [
        {
          type: 1, // Action row
          components: [inviteButton],
        },
      ],
      ephemeral: true, // ทำให้การตอบกลับนี้เป็นข้อความที่เห็นแค่ผู้ที่ใช้คำสั่ง
    });
  },
};
