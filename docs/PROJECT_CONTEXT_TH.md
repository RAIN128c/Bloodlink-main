# รายละเอียดโครงงานและวิธีการดำเนินงาน (Project Details & Methodology)

## ส่วนที่ 1: ทฤษฎีและหลักการที่เกี่ยวข้อง (Context & Theory)

### 1.1 บริบทของระบบ (Clinical Context)
*   **ระบบส่งต่อผู้ป่วย (Patient Flow):** ช่วยลดความล่าช้าในการส่งข้อมูลระหว่าง รพ.สต. และโรงพยาบาลแม่ข่าย
*   **ระบบห้องปฏิบัติการ (LIS):** การจัดการข้อมูลปริมาณการตรวจเลือดและผลตรวจ (CBC, Chemistry, Immunology) ให้เป็นรูปแบบดิจิทัล (Digital Transformation) โดยไร้รอยต่อ ลดความผิดพลาดจากการเขียนกระดาษด้วยมือ (Manual Transcription Errors)
*   **การแบ่งแยกงาน (Separation of Duties):** ป้องกันการข้ามสายงานระหว่างเทคนิคการแพทย์ (MedTech) พยาบาล (Nurse) และแพทย์ (Doctor) โดยมีสิทธิการแก้ไขข้อมูลที่บังคับด้วยเงื่อนไข

### 1.2 เทคโนโลยีที่เลือกใช้ (Technology Stack)
*   **Web Application Architecture:** สถาปัตยกรรมแบบ Client-Server เพื่อให้เข้าถึงได้จากทุกอุปกรณ์ ทั้ง Tablet หรือ PC ของโรงพยาบาล
*   **Next.js (App Router):** หัวใจหลักในการทำ Server-Side Rendering (SSR) และความเสถียรของหน้าเว็บไซต์
*   **Tailwind CSS:** สำหรับการออกแบบ UI/UX ที่ยืดหยุ่น โหลดรวดเร็ว และสวยงาม 
*   **Supabase (PostgreSQL) + Prisma ORM:** ฐานข้อมูลเชิงสัมพันธ์ที่เสถียร ใช้ ORM ควบคุม Schema ให้เขียนโค้ดได้อย่างปลอดภัยด้วย Typescript และรองรับการทำ Data Encryption
*   **OCR Integration:** นำมาปรับประยุกต์ใช้เพื่อ Scan กระดาษผลวิเคราะห์ แปลงเป็นตัวพิมพ์อัตโนมัติ 

### 1.3 ความปลอดภัย (Security & Compliance)
*   **PDPA & Health Data Privacy:** การออกแบบข้อจำกัดการเข้าถึง โดยซ่อนรายการที่ผู้ไม่มีสิทธิ์ไม่สามารถเข้าดูบันทึกได้ และใช้เทคนิค Server Actions ป้องกันการส่ง Payload ปลอม
*   **E-Signature & Digital Pins:** ใช้ PIN Code ที่เข้ารหัสในการลงนามผลตรวจ ยกระดับให้เอกสารอิเล็กทรอนิกส์มีผลยืนยันทางกฎหมาย หรือตรวจสอบ (Auditable) ได้เสมอ

---

## ส่วนที่ 2: วิธีการดำเนินงาน (SDLC & Development Methodology)

การพัฒนาโครงงานนี้ใช้วงจร Agile ผสม SDLC โดยมี Phase สำคัญดังนี้:

### ขั้นตอนที่ 1: การรวบรวมความต้องการ (Requirement Gathering)
*   ศึกษาปัญหาความล่าช้าในการส่งผลแล็บ, ปัญหาใบแล็บปลิวหาย, และรูปแบบการจัดวางกระดาษที่ผู้ใช้คุ้นชิน
*   สอบถามความต้องการจากผู้ใช้งานจริง ทั้งจากในห้องเจาะเลือด และห้องวิเคราะห์

### ขั้นตอนที่ 2: การอัปเกรดระบบ (System Re-Architecture)
*   ย้ายจากโครงสร้าง Express/EJS เดิม มาสู่ **Next.js 14+** แบบก้าวกระโดด
*   เปลี่ยนจาก Google Sheets (NoSQL Prototype) มาจบที่ **Supabase (Relational Database)** โดยสมบูรณ์

### ขั้นตอนที่ 3: การสร้างฐานระบบบัญชีผู้ใช้และจัดการสิทธิ์ (Setup DB & RBAC)
*   ร่างและกำหนด **ER Diagram** (ผ่าน Prisma Schema)
*   สร้างหน้าจอล็อกอิน แบ่งช่องการไหลของสิทธิ (Nurse, MedTech, Admin, Doctor)

### ขั้นตอนที่ 4: การพัฒนาฟีเจอร์เชิงลึก (Core Implementation)
*   สร้างหน้ากระดาน My Tasks สำหรับลดความหนาแน่นในห้องแล็บ
*   สร้างระบบ **Batch Printing** ผูกเข้ากับ API สร้าง Hash Snapshot ของใบปะหน้าคิวและใบผล A5 ออกมาทีเดียวหลัก 100 ใบ
*   สร้างหน้าจอยืนยันเพื่อสกัดข้อมูลแบบเรียลไทม์ผ่านกล้อง OCR 

### ขั้นตอนที่ 5: การทดสอบ การดีบัก และใช้งานจริง (Testing & Production)
*   **Linting & UI Testing:** วางมาตรฐาน Typescript ปิดจุดอ่อนและช่องโหว่ (เช่น บล็อค `any` / ป้องกัน Reference Errors) 
*   **Vercel Deployment:** ห่อหุ้มโปรเจกต์ โฮสต์ขึ้นบน Vercel และเชื่อมต่อ Production DB แบบสมบูรณ์ 

---

## เครื่องมือที่ใช้ (Tools)
*   **IDE:** Visual Studio Code 
*   **Version Control:** Git & GitHub 
*   **Database Admin:** Supabase / Prisma Studio
*   **Design & UI Components:** Shadcn UI, Framer Motion, Lucide-React
*   **Hosting:** Vercel (Frontend & Server Functions)
