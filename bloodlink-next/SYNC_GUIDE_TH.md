# คู่มือการอัปเดต Code จาก GitHub หลัก (Manual Sync)

เอกสารนี้อธิบายขั้นตอนการนำ Code ล่าสุดจาก GitHub ของต้นทาง (`RAIN128c/Bloodlink`) ไปอัปเดตลงในโปรเจกต์ของคุณ (กรณีที่ทำงานคนละ Repository กัน)

## repositories
- **Source Repo (ต้นทาง):** `https://github.com/RAIN128c/Bloodlink`
- **Target Repo (ของคุณ):** *โฟลเดอร์โปรเจกต์ของคุณเอง*

---

## ขั้นตอนการทำ (Step-by-Step)

### 1. เตรียมไฟล์จากต้นทาง (Source)
ให้ทำการดาวน์โหลดไฟล์ล่าสุดจาก GitHub ของต้นทางมาไว้ในเครื่องก่อน โดยมี 2 วิธี:

**วิธี A: ใช้ Git Clone (แนะนำ - เพื่อให้ดึงอัปเดตครั้งถัดไปง่าย)**
เปิด Terminal แล้วรันคำสั่งเพื่อ Clone ลงมาในโฟลเดอร์ใหม่ (ตั้งชื่อเช่น `bloodlink-source-update` เพื่อไม่ให้ซ้ำกับงานปัจจุบัน):
```bash
git clone https://github.com/RAIN128c/Bloodlink.git bloodlink-source-update
cd bloodlink-source-update
```

**วิธี B: ดาวน์โหลดเป็น ZIP**
1. ไปที่หน้าเว็บ [https://github.com/Supazuto/Bloodlink](https://github.com/Supazuto/Bloodlink)
2. กดปุ่มสีเขียว **<> Code** -> เลือก **Download ZIP**
3. แตกไฟล์ ZIP ออกมา

### 2. นำไฟล์ไปวางในโปรเจกต์ของคุณ (Copy & Paste)
1. เปิดโฟลเดอร์ที่เพิ่งดาวน์โหลดมา (Source)
2. เปิดโฟลเดอร์โปรเจกต์ปัจจุบันของคุณ (Target)
3. **ทำการ Copy ไฟล์และโฟลเดอร์ทั้งหมด** จาก Source ไปวางทับใน Target
   
   > **ข้อควรระวัง (ยกเว้นไฟล์เหล่านี้):**
   > ห้ามคัดลอกทับไฟล์หรือโฟลเดอร์เหล่านี้ หากมีการตั้งค่าเฉพาะของตนเอง:
   > - โฟลเดอร์ `.git` (ห้ามคัดลอกทับเนื่องจากจะทำให้ระบบควบคุมเวอร์ชันเสียหาย)
   > - ไฟล์ `.env` หรือ `.env.local` (เนื่องจากเป็นไฟล์รหัสผ่าน)
   > - โฟลเดอร์ `node_modules` (ไม่ต้องคัดลอกทับ ระบบจะใช้คำสั่งติดตั้งใหม่)

   **โฟลเดอร์สำคัญที่ต้องคัดลอก:**
   - `src` (Source code ทั้งหมด)
   - `public` (รูปภาพและ Assets)
   - `supabase` (ไฟล์ Migration ฐานข้อมูล หากมี)
   - `package.json` และ `package-lock.json`

### 3. อัปเดตและรันโปรเจกต์
เมื่อวางไฟล์เสร็จแล้ว ให้เปิด Terminal ในโปรเจกต์ของคุณแล้วรันคำสั่ง:

1. **ลง Library ใหม่ (ถ้ามี)**
   ```bash
   npm install
   ```

2. **(ถ้ามีการแก้ฐานข้อมูล) รัน Migration**
   ถ้ามีการแจ้งว่ามีการแก้ Database ให้รันคำสั่งนี้ (ตรวจสอบก่อนว่าใช้ Supabase หรือ Database อะไร):
   ```bash
   npx supabase db push
   # หรือตาม command ที่ทีมตกลงกัน
   ```

3. **ทดสอบรัน**
   ```bash
   npm run dev
   ```

### 4. บันทึกงานลง GitHub ของคุณ (Push)
เมื่อทุกอย่างทำงานได้ปกติ ให้ทำการ Commit และ Push ขึ้น GitHub ของคุณตามปกติ:
```bash
git add .
git commit -m "Update code from main repo (RAIN128c/Bloodlink)"
git push
```
