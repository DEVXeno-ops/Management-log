const fs = require('fs'); 
const path = require('path');

const settingsPath = path.join(__dirname, 'guildSettings.json');

// ฟังก์ชันดึงการตั้งค่าของเซิร์ฟเวอร์
const getGuildSettings = async (guildId) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่ก่อนที่จะอ่าน
    if (!fs.existsSync(settingsPath)) {
      console.log('⚠️ ไฟล์ settings ไม่พบ กำลังสร้างไฟล์ใหม่...');
      await fs.promises.writeFile(settingsPath, JSON.stringify({}));  // สร้างไฟล์ว่างๆ
    }

    const data = await fs.promises.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    return settings[guildId] || null;  // คืนค่าการตั้งค่าของเซิร์ฟเวอร์หรือตัวแปร null
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
};

// ฟังก์ชันบันทึกการตั้งค่าของเซิร์ฟเวอร์
const saveGuildSettings = async (guildId, settings) => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่ก่อนที่จะอ่าน
    if (!fs.existsSync(settingsPath)) {
      console.log('⚠️ ไฟล์ settings ไม่พบ กำลังสร้างไฟล์ใหม่...');
      await fs.promises.writeFile(settingsPath, JSON.stringify({}));  // สร้างไฟล์ว่างๆ
    }

    const data = await fs.promises.readFile(settingsPath, 'utf-8');
    const allSettings = JSON.parse(data);
    allSettings[guildId] = settings;

    await fs.promises.writeFile(settingsPath, JSON.stringify(allSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

module.exports = { getGuildSettings, saveGuildSettings };
