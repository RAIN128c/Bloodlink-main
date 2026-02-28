<div align="center">
  <img src="./bloodlink-next/public/images/logo.png" width="200" alt="BloodLink Logo" />
  <h1>BloodLink System (Healthcare & Lab Management)</h1>
  <p><strong>v1.0.0 - Production Ready</strong></p>
  <p>ระบบบริหารจัดการข้อมูลผู้ป่วยและการทำงานทางห้องปฏิบัติการ (LIS) แบบครบวงจร</p>
</div>

---

**Bloodlink** เป็น Web Application สถาปัตยกรรมระดับองค์กร (Enterprise-grade) ที่ถูกออกแบบมาเพื่อยกระดับการจัดการตารางงาน การติดตามผลเลือด และกระบวนการทำงานในคลินิกหรือโรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) โดยเปลี่ยนผ่านจากการจดด้วยกระดาษ (Manual Transcription) มาเป็นระบบดิจิทัล (Digital Transformation) อย่างเต็มรูปแบบ ไร้รอยต่อ และมีความปลอดภัยสูงสุด

## ความสามารถหลักของระบบ (Core Features)

1. **ระบบลงทะเบียนและคัดกรองผู้ป่วย (Patient & Pre-Lab Registry):**
   - จัดการข้อมูลประวัติผู้ป่วย การนัดหมาย และคัดกรองอาการเบื้องต้น (ความดัน, น้ำหนัก, ส่วนสูง) ได้ทันทีก่อนพบแพทย์
   - ติดตาม Track Status ได้แบบเรียลไทม์ว่าผู้ป่วยอยู่ในขั้นตอนใด (รอเจาะเลือด -> รอแล็บรับเรื่อง -> กำลังตรวจ -> เสร็จสิ้น)

2. **ระบบจัดการคิวห้องปฏิบัติการอัจฉริยะ (Smart Lab Queue & My Tasks):**
   - **Separation of Duties:** แยกหน้าจอและฟังก์ชันของพยาบาล/แพทย์ ออกจากเทคนิคการแพทย์อย่างชัดเจน
   - **My Tasks (งานของฉัน):** เทคนิคการแพทย์สามารถกด "รับสิทธิ์อนุมัติ" (Assign) คิวงานมาเป็นของตนเอง เพื่อป้องกันการทำงานซ้ำซ้อนกับเจ้าหน้าที่แล็บท่านอื่น
   - **Server Actions Guard:** ระบบตรวจสอบสิทธิ์ที่เข้มงวด ป้องกันการกดข้ามสถานะหรือการลักลอบแก้ไขข้อมูลโดยผู้ไม่มีสิทธิ์

3. **สถาปัตยกรรมการพิมพ์ขั้นสูง (Advanced Batch Printing):**
   - รองรับการสั่งพิมพ์ "ใบปะหน้าสรุปคิว (A4)" ควบคู่ไปกับ "ใบส่งตรวจวิเคราะห์ (A5)" แบบกลุ่มพร้อมกันหลักร้อยใบ
   - เทคโนโลยี **Frozen Snapshot Pipeline:** เมื่อกดพิมพ์ ระบบจะแช่แข็งข้อมูล (Snapshot) ลงฐานข้อมูลชั่วคราว เพื่อป้องกันข้อมูลเคลื่อนเคลื่อนหากมีการแก้ไขประวัติระหว่างที่กำลังโหลดหน้ากระดาษ

4. **ระบบอัตโนมัติด้วย OCR (OCR Lab Automation):**
   - รองรับการอัปโหลดหรือถ่ายรูปหน้ากระดาษผลแล็บจากเครื่องวิเคราะห์
   - ระบบจะทำ Optical Character Recognition (OCR) ดึงเฉพาะค่าตัวเลขที่สำคัญมากรอกลงในแบบฟอร์มผลเลือดให้อัตโนมัติ ลดข้อผิดพลาดจากมนุษย์ (Human Error)

5. **ลายเซ็นอิเล็กทรอนิกส์และ PIN Code (E-Signature & Security):**
   - เทคนิคการแพทย์และแพทย์ต้องใช้รหัส **PIN 6 หลัก** ในการยืนยันผลแล็บ
   - ระบบจะสร้าง Digital Signature พร้อมประทับ Timestamp และ **QR Code** ลงบนใบรายงานผลทางคอมพิวเตอร์ เพื่อให้มีผลบังคับใช้และตรวจสอบย้อนหลังได้ (Auditable)

6. **ประสิทธิภาพระดับสูงสุดด้วย Server Components:**
   - หน้า Dashboard และ Admin Panel ถูกออกแบบด้วยสถาปัตยกรรม **Next.js Server Components** เชื่อมต่อฐานข้อมูลโดยตรงบนเซิร์ฟเวอร์
   - โหลดข้อมูลทันทีแบบ Zero-Layout-Shift ทำให้ประสิทธิภาพความเร็วของเว็บไซต์สูงมาก เหมาะสำหรับคอมพิวเตอร์และแท็บเล็ตในโรงพยาบาล

---

## เอกสารประกอบ (Comprehensive Documentation)

โครงงานนี้ถูกออกแบบและวิเคราะห์ระบบมาอย่างรอบคอบ สามารถอ่านรายละเอียดสถาปัตยกรรมเบื้องลึก ทฤษฎีแนวคิด และคู่มือการใช้งานได้ในโฟลเดอร์ `docs/`:

*   **[คู่มือการใช้งานสำหรับบุคลากร (User Manual)](docs/USER_MANUAL_TH.md)**
*   **[การวิเคราะห์ระบบและโครงสร้างฐานข้อมูล (System Analysis)](docs/SYSTEM_ANALYSIS_TH.md)**
*   **[รายละเอียดโครงงานและระเบียบวิธีดำเนินงาน (Project Context & Methodology)](docs/PROJECT_CONTEXT_TH.md)**
*   **[ตัวอย่างและรูปแบบของโค้ด (Code Examples)](docs/CODE_EXAMPLES_TH.md)**

## โครงสร้างเทคโนโลยี (Tech Stack)

*   **Frontend Framework:** Next.js 16+ (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling & UI:** Tailwind CSS, Framer Motion, Shadcn UI, Lucide Icons
*   **Backend & Database:** Supabase (PostgreSQL)
*   **State Management & Reactivity:** React Hooks, Recharts, Server Actions
*   **Authentication:** NextAuth.js (Session JWT) + 6-Digit PIN System

## การติดตั้งและพัฒนาต่อ (Setup & Run)

```bash
# โคลนโปรเจกต์และเข้าสู่ซอร์สโค้ดหลัก
cd bloodlink-next

# ติดตั้งแพ็กเกจ (Dependencies)
npm install

# รันเซิร์ฟเวอร์ในโหมดพัฒนา
npm run dev

# คอมไพล์เพื่อใช้งานบน Production
npm run build
npm run start
```