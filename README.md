# 🩸 BloodLink System (Healthcare & Lab Management)

**Bloodlink (v1.0.0 - Production Ready)** is a comprehensive Web Application designed for managing patient blood test workflows in a clinic or laboratory setting (รพ.สต.). It facilitates the entire process from patient registration to result delivery.

---

## 🚀 สรุปอัปเดตระบบใหญ่ล่าสุด (Production Ready)

การอัปเดตครั้งโค้งสุดท้ายครอบคลุมความสามารถหลักทั้งหมด:

1. **ระบบ PIN Code ลายเซ็นอิเล็กทรอนิกส์ (E-Signature):** 
   - รองรับ PIN 6 หลักสำหรับบุคลากร (แพทย์, พยาบาล, เทคนิคการแพทย์)
   - มีการประทับตรา Digital Signature และ QR Code เพื่อยืนยันความถูกต้องของใบส่งตรวจ
2. **ระบบการพิมพ์สมบูรณ์แบบ (Batch Printing & Snapshot):**
   - รองรับการสั่งพิมพ์ "ใบปะหน้าสรุปคิว (A4)" ควบคู่ไปกับ "ใบส่งตรวจวิเคราะห์ (A5)" แบบกลุ่ม
   - ระบบ *Frozen Snapshot* ป้องกันปัญหาข้อมูลเปลี่ยนแปลงระหว่างโหลดหน้ากระดาษ
3. **การจัดการคิวแล็บอัจฉริยะ (Smart Lab Queue):**
   - **My Tasks (งานของฉัน):** เทคนิคการแพทย์สามารถกดรับคิว เพื่อจัดการหลอดเลือดของตนเองแบบแยกส่วน
   - การอนุมัติและอัปโหลดผลแล็บผ่านระบบ OCR ที่ดึงค่าจากรูปถ่ายเข้าสู่ฟอร์มอัตโนมัติ
4. **ความปลอดภัยและเสถียรภาพระดับสูงสุด (Security & Data Integrity):**
   - Server Actions สำหรับปกป้องข้อมูล ป้องกันพยาบาลกดข้ามสถานะ และป้องกันข้อมูลคนไข้สูญหายเมื่อแก้ไขโปรไฟล์

---

## 📖 คู่มือการใช้งาน (User Manual)

### 🩺 สำหรับฝ่ายพยาบาล / แพทย์ 
1. **ลงทะเบียนผู้ป่วย:** เมนู "ผู้ป่วย" -> กรอก HN, ชื่อ, โรคประจำตัว
2. **เจาะเลือด (Pre-Lab):** ในประวัติผู้ป่วย บันทึกความดัน, น้ำหนัก, และเลือกรายการแล็บที่ต้องเจาะ 
3. **ติดตามคิว:** เมนู "สถานะผลตรวจเลือด" เพื่อตรวจดูความคืบหน้าแบบ Real-time (พิมพ์ใบส่งตรวจ A5 ย้อนหลังได้ที่นี่)

### 🔬 สำหรับห้องปฏิบัติการ / เทคนิคการแพทย์
1. **ตารางงานแล็บ:** เมนู "คิวงานแล็บ" ดูรายชื่อที่เพิ่งส่งเจาะเลือด 
   - (สามารถเลือกหลายรายชื่อเพื่อ **สั่งพิมพ์ใบปะหน้าและใบส่งตรวจ** ทีเดียวเป็นปึกได้)
2. **การอัปโหลดผล (OCR):** ถ่ายรูปใบผลตรวจ หรืออัปโหลดไฟล์ให้ระบบดึงค่าตัวเลขมาใส่ฟอร์ม
3. **รายงานผล (Results):** ตรวจสอบความถูกต้องและกด "พิมพ์เพื่อยืนยัน" การ์ดรายชื่อจะถูกส่งเข้าคลังประวัติผู้ป่วยทันที

### ⚙️ สำหรับแอดมิน
- ดู **สถิติรายงาน (Reports)** ย้อนหลัง และเข้าไปแก้ไขหน้าต่างคิวแทนเจ้าหน้าที่ได้หากเกิดเรื่องฉุกเฉิน

---

## 📚 Documentation (เอกสารประกอบ)
Detailed documentation regarding system analysis, architecture, and development methodology can be found in the `docs/` folder:

*   **[คู่มือการใช้งาน (User Manual)](docs/USER_MANUAL_TH.md)**
*   **[การวิเคราะห์ระบบ (System Analysis)](docs/SYSTEM_ANALYSIS_TH.md)**
*   **[รายละเอียดและวิธีการดำเนินงาน (Context & Methodology)](docs/PROJECT_CONTEXT_TH.md)**
*   **[ตัวอย่างโค้ด (Code Examples)](docs/CODE_EXAMPLES_TH.md)**

## 🛠️ Tech Stack & Setup
- **Framework:** Next.js 14+ (App Router), TypeScript
- **Database:** Supabase (PostgreSQL), Prisma ORM
- **Styling:** Tailwind CSS + Framer Motion

```bash
# พัฒนาต่อ (เข้าสู่โฟลเดอร์หลัก)
cd bloodlink-next

# ติดตั้งแพ็กเกจ
npm install

# รันเซิร์ฟเวอร์
npm run dev
```

*Developed exclusively by สมาคมคนเถื่อน for the ultimate medical technology ecosystem.* 💙