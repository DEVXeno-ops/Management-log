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
    return settings[guildId] || {};  // คืนค่าการตั้งค่าของเซิร์ฟเวอร์หรือตัวแปรว่าง
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};  // คืนค่าการตั้งค่าว่างกรณีเกิดข้อผิดพลาด
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

    // เพิ่มการตรวจสอบการตั้งค่าก่อนที่จะบันทึก
    if (!allSettings[guildId]) {
      allSettings[guildId] = {};  // หากยังไม่มีการตั้งค่าของเซิร์ฟเวอร์นี้ สร้างใหม่
    }

    // อัพเดตการตั้งค่า
    allSettings[guildId] = { ...allSettings[guildId], ...settings };

    await fs.promises.writeFile(settingsPath, JSON.stringify(allSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

module.exports = { getGuildSettings, saveGuildSettings };
