## 📁 `README.md` – Management-log Discord Bot
```markdown
# 💼 Management-log Discord Bot

ระบบบอทสำหรับจัดการผู้ใช้ในเซิร์ฟเวอร์ Discord  
รองรับคำสั่ง `kick`, `ban`, `logs` พร้อมระบบส่ง Embed log อัตโนมัติไปยังช่อง `#mod-logs`

---

## 📌 คำสั่งที่มี

| คำสั่ง        | สิทธิ์ที่ต้องมี          | รายละเอียด                                      |
|----------------|---------------------------|-------------------------------------------------|
| `/kick`        | เตะสมาชิก (Kick Members)  | เตะผู้ใช้จากเซิร์ฟเวอร์ พร้อมเหตุผลและ log     |
| `/ban`         | แบนสมาชิก (Ban Members)   | แบนผู้ใช้จากเซิร์ฟเวอร์ พร้อมเหตุผลและ log     |
| `/logs`        | ดู audit log              | ส่งลิงก์ไปยังช่อง log                          |

---

## ⚙️ วิธีใช้งาน

1. **ติดตั้ง Node.js v18+** และ Discord.js v14
2. สร้างบอทใน [Discord Developer Portal](https://discord.com/developers/applications)
3. เพิ่ม Token ของคุณใน `.env`

```

DISCORD\_TOKEN=your\_token\_here

```

4. สร้างโฟลเดอร์ `commands/` แล้วใส่ไฟล์:
   - `kick.js`
   - `ban.js`
   - `logs.js`

5. สร้างไฟล์ `index.js` แล้วเชื่อมคำสั่งแบบปกติ (ดูตัวอย่างด้านล่าง)

---

## 🧾 Log จะไปที่ไหน?

> Log ทั้งหมดจะถูกส่งไปยังห้องที่ชื่อว่า:  
> 📂 `#mod-logs` *(สร้างห้องนี้ไว้ล่วงหน้า)*

📥 ตัวอย่าง Embed Log:

```

⛔ ผู้ใช้ถูกแบน
👤 ผู้ใช้: Player#0001 (1234567890)
📄 เหตุผล: ใช้คำหยาบ
👮 โดย: AdminX#1111

````

---

## 🔐 สิทธิ์ที่ต้องเปิดให้บอท

- ✅ Kick Members
- ✅ Ban Members
- ✅ View Audit Log
- ✅ Send Messages + Embed Links (ในห้อง log)

---

## 🧪 ตัวอย่าง index.js แบบย่อ

```js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

for (const file of fs.readdirSync('./commands')) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (command) await command.execute(interaction);
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
````

---

## 👨‍💻 ผู้พัฒนา

📌 โดย \[Xeno]
📬 ติดต่อ: \[DEVXeno-ops]

---

> 🛡️ ระบบนี้เหมาะสำหรับเซิร์ฟเวอร์เกม, ชุมชน หรือทีมงานที่ต้องการจัดการสมาชิกอย่างโปร!

```

