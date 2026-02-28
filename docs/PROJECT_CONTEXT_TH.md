<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../bloodlink-next/public/images/logo_d.png">
    <img src="../bloodlink-next/public/images/logo.png" width="400" alt="BloodLink Logo" />
  </picture>
  <h1>รายละเอียดโครงงานและวิธีการดำเนินงาน (Project Details & Methodology)</h1>
</div>

---

## ส่วนที่ 1: ทฤษฎีและหลักการที่เกี่ยวข้อง (Context & Theory)

### 1.1 บริบทของระบบ (Clinical Context)
*   **ระบบส่งต่อผู้ป่วย (Patient Flow):** ถูกสร้างขึ้นเพื่อลบจุดบอดในการสื่อสารและลดความล่าช้าในการส่งข้อมูลระหว่างแผนกผู้ป่วยนอก (OPD) แผนกเจาะเลือด และห้องปฏิบัติการ (Laboratory)
*   **ระบบห้องปฏิบัติการ (LIS - Laboratory Information System):** มุ่งเน้นไปที่การจัดการข้อมูลปริมาณการตรวจผลเลือด (เช่น CBC, Chemistry, Immunology) ให้เป็นรูปแบบดิจิทัล (Digital Transformation) โดยไร้รอยต่อ เพื่อลดความผิดพลาดจากการเขียนกระดาษด้วยมือ (Manual Transcription Errors)
*   **การแบ่งแยกงาน (Separation of Duties):** ออกแบบระบบให้ป้องกันการข้ามสายงานระหว่างเทคนิคการแพทย์ (MedTech) พยาบาล (Nurse) และแพทย์ (Doctor) โดยมีสิทธิการแก้ไขข้อมูลที่บังคับด้วย Role-Based Access Control (RBAC) ทั้งฝั่ง Client และ Server

### 1.2 เทคโนโลยีที่เลือกใช้ (Technology Stack)
*   **Web Application Architecture:** ใช้สถาปัตยกรรมแบบ Client-Server เพื่อให้เข้าถึงได้จากทุกอุปกรณ์ ทั้ง Tablet เบื้องหน้า หรือ PC ของโรงพยาบาล โดยไม่ต้องติดตั้งซอฟต์แวร์
*   **Next.js 16+ (App Router) & Server Components:** หัวใจหลักในการทำ Server-Side Rendering (SSR) ร่วมกับ React 19 นำกระบวนการดึงข้อมูล (Data Fetching) ไปไว้บนเซิร์ฟเวอร์ก่อนส่ง HTML มาให้เบราว์เซอร์ เพื่อประสิทธิภาพความเร็วสูงสุด
*   **Tailwind CSS + Framer Motion:** สำหรับการออกแบบ UI/UX ที่ทันสมัย พร้อม Micro-interactions
*   **Supabase (PostgreSQL):** ฐานข้อมูลเชิงสัมพันธ์ระดับองค์กร ใช้ Supabase Client สำหรับทุก Database Query
*   **Tesseract.js (OCR):** สกัดค่าตัวเลขจากภาพผลตรวจแล็บ กรอกลงฟอร์มอัตโนมัติ
*   **Nodemailer + Resend:** ระบบอีเมลอัตโนมัติ (Password Reset, Welcome, Account Approved)
*   **Recharts:** กราฟสถิติสำหรับ Admin Reports (แยก scope: ชม./วัน/สัปดาห์/เดือน/ปี)
*   **React Hook Form + Zod:** Form validation ทั้งฝั่ง Client และ Server

### 1.3 ความปลอดภัย (Security & Compliance)
*   **PDPA & Health Data Privacy:** การออกแบบข้อจำกัดการเข้าถึง โดยซ่อนรายการที่ผู้ไม่มีสิทธิ์ไม่สามารถเข้าดูได้ และใช้ Server Actions สำหรับทุก Mutation เพื่อป้องกันการส่ง Payload ปลอม
*   **E-Signature & Digital PINs:** PIN Code 6 หลัก (bcrypt hash) สำหรับลงนามผลตรวจ พร้อมตราประทับ Digital QR Code ตรวจสอบย้อนหลังได้
*   **Rate Limiting:** ป้องกัน Brute-force attacks บน API endpoints
*   **Cloudflare Turnstile CAPTCHA:** ป้องกัน Bot ที่หน้า Login/Register
*   **Status History Audit Trail:** บันทึกทุกการเปลี่ยนสถานะ (ใคร, เมื่อไหร่, บทบาทอะไร) ลงตาราง `status_histories`

---

## ส่วนที่ 2: วิธีการดำเนินงาน (SDLC & Development Methodology)

การพัฒนาโครงงานนี้ใช้วงจรการพัฒนาระบบ (SDLC) แบบครอบคลุม โดยมีทิศทางการพัฒนาที่ต่อเนื่องดังนี้:

### ขั้นตอนที่ 1: การรวบรวมความต้องการและวิเคราะห์ปัญหา (Requirement Gathering & Analysis)
*   วิเคราะห์ปัญหาความล่าช้าในการส่งผลแล็บ, การสูญหายของใบแล็บ, และรูปแบบการจัดวางเอกสารรายงานที่แพทย์คุ้นชิน
*   กำหนดโมเดลผังงาน (Workflow) ตั้งแต่คนไข้เดินเข้าคลินิก ไปจนถึงรับผลเลือดเสร็จสิ้น

### ขั้นตอนที่ 2: การพัฒนาโครงสร้างพื้นฐาน (Enterprise Infrastructure Setup)
*   สร้างโครงสร้างโปรเจกต์ด้วย **Next.js 16+** ร่วมกับ **React 19**
*   วางสถาปัตยกรรมฐานข้อมูลด้วย **Supabase (PostgreSQL)** จำนวน 11 ตาราง
*   สร้าง Service Layer 10 ไฟล์ รวม 70+ methods สำหรับ Business Logic

### ขั้นตอนที่ 3: การพัฒนาระบบแกนกลางและการคัดกรองสิทธิ์ (Core Systems & RBAC)
*   พัฒนาหน้า Dashboard และ Admin Panel แบบ Server Components เพื่อดึงสถิติแบบ Zero-Layout-Shift
*   สร้าง Permission Guards (4 บทบาท) และ Status Workflow Transitions พร้อม Role Guard ทุกขั้นตอน
*   พัฒนาระบบ Inbox/Messaging สำหรับการสื่อสารระหว่างบุคลากร
*   พัฒนาระบบ Notification อัตโนมัติ เมื่อสถานะเปลี่ยนแปลง

### ขั้นตอนที่ 4: การพัฒนาระบบขั้นสูง (Advanced Lab Solutions)
*   สร้างระบบ **Smart Lab Queue & My Tasks** ควบคุม Load งานของนักเทคนิคการแพทย์แต่ละคน
*   สร้างระบบ **Batch Printing** ด้วย Frozen Snapshot Pipeline
*   วางระบบ **E-Signature** ร่วมกับ PIN Server Action
*   พัฒนาระบบ **OCR** สำหรับอ่านผลตรวจจากภาพ
*   สร้างระบบ **Appointments** พร้อม Vital Signs Recording
*   พัฒนาระบบ **Admin Reports** พร้อมกราฟสถิติแยก 5 ระดับ

### ขั้นตอนที่ 5: การทดสอบและปรับแต่ง (Testing, Debugging & Optimization)
*   **Type Safe & Linting:** วางมาตรฐาน Strict TypeScript ทั้งโปรเจกต์
*   **Permission Fixes:** แก้ไขช่องโหว่ของการอัปเดตสถานะ, บันทึกรอยเท้าไว้ใน `status_histories`
*   **Rate Limiting & CAPTCHA:** ป้องกัน Brute-force และ Bot attacks
*   **Email Integration:** ระบบอีเมลอัตโนมัติ (Password Reset, Welcome, Account Approved)
*   **Deployment:** CI/CD ผ่าน GitHub Actions + Vercel สู่ Production Ready
