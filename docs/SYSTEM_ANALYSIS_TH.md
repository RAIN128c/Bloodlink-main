<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../bloodlink-next/public/images/logo_d.png">
    <img src="../bloodlink-next/public/images/logo.png" width="400" alt="BloodLink Logo" />
  </picture>
  <h1>การวิเคราะห์ระบบและสถาปัตยกรรม (System Analysis & Architecture)</h1>
</div>

---

## 1. ภาพรวมของระบบ (System Overview)
**Bloodlink** เป็นซอฟต์แวร์แอปพลิเคชัน (Enterprise Web Application) ระดับ Comprehensive Medical Workflow ออกแบบมาสำหรับโรงพยาบาลและคลินิก เพื่อกำจัดจุดบอดและพฤติกรรมคอขวดของการใช้งานกระดาษในห้องปฏิบัติการทางเคมี (Laboratory) โดยเน้นไปที่ความเร็วในการโหลดข้อมูล ความแม่นยำในการรักษาประวัติ และการติดตามความคืบหน้าของคิวเจาะเลือด (Patient Journey) อย่างเป็นระบบ

## 2. เทคโนโลยีและสถาปัตยกรรมหลัก (Software & Tech Stack)

| ชั้น | เทคโนโลยี | รายละเอียด |
|------|-----------|------------|
| Framework | Next.js 16+ (App Router) | TypeScript, React 19, Server Components |
| UI/CSS | Tailwind CSS, Framer Motion | Lucide Icons, Sonner Toast |
| State | React Hooks, Server Actions | ไม่ใช้ Redux/Zustand |
| Auth | NextAuth.js | Session JWT + 6-Digit PIN (bcrypt) |
| Database | Supabase (PostgreSQL) | ใช้ Supabase Client โดยตรง |
| Email | Nodemailer + Resend | Gmail/Custom SMTP, Password Reset, Welcome Email |
| OCR | Tesseract.js | สกัดค่าตัวเลขจากภาพผลตรวจ |
| Charts | Recharts | กราฟสถิติ Admin Reports |
| Print | html2canvas + jsPDF | Snapshot Pipeline, Batch Printing |
| File I/O | xlsx, PapaParse, pdfjs-dist | อ่าน/เขียน Excel, CSV, PDF |
| Form | React Hook Form + Zod | Input Validation |
| Security | Cloudflare Turnstile | CAPTCHA ป้องกัน Bot |
| Hosting | Vercel | Auto-deploy จาก GitHub |
| CI/CD | GitHub Actions | `sync.yml` (auto-sync forks), `migrate-users.yml` |

## 3. ฟีเจอร์แกนกลางและกระบวนการทำงาน (Core Workflows)

### 3.1 Patient & Pre-Lab Registry (ระบบผู้ป่วยนอก)
*   จัดการระบบลงทะเบียนผู้ป่วยและลงข้อมูลสำคัญทางการแพทย์เบื้องต้น (ความดันเลือด น้ำหนัก ส่วนสูง รอบเอว อุณหภูมิ ชีพจร)
*   พยาบาลสามารถจัดแพ็กเกจการเจาะเลือดแบบ Custom หรือตามโปรแกรมสุขภาพได้ทันทีก่อนคนไข้เดินเข้าห้องเจาะเลือด
*   รองรับการ Bulk Import ข้อมูลผู้ป่วยจากไฟล์ Excel/CSV

### 3.2 Smart Lab Queue & My Tasks (ระบบแจกจ่ายงานห้องปฏิบัติการ)
*   **คิวงานแล็บรวม (Global Lab Queue):** ผู้ป่วยทุกคนที่สถานะ "รอเจาะเลือด" และ "รอแล็บรับเรื่อง" จะถูกเรียงตัวอยู่ที่นี่
*   **ระบบงานของฉัน (Isolated My Tasks):** เมื่อเทคนิคการแพทย์คนใดคนหนึ่งกด "รับตัว" — ระบบจะตัดชื่อผู้ป่วยคนนั้นเข้าสู่ตะกร้างานส่วนตัว (Assignee Binding) ป้องกันการทำงานซ้ำซ้อน
*   **Bulk Assign:** สามารถเลือกรับคิวหลายคนพร้อมกันได้

### 3.3 Advanced Batch Printing (ระบบคำสั่งพิมพ์ขั้นสูง)
*   เมื่อผู้ใช้สั่งพิมพ์กลุ่ม ระบบจะบันทึก Payload ลง Table `print_snapshots` ด้วย **Hash ID** ชั่วคราว (Frozen State)
*   จากนั้นเบราว์เซอร์จะเปิดหน้าต่างพิมพ์แยก โดยดึงข้อมูลที่แช่แข็งมา Render ผ่าน **Server Components** ทำให้พิมพ์ "สรุปคิว A4" + "ใบส่งตรวจ A5" ได้ทีเดียวเป็นปึก

### 3.4 OCR Medical Automation (ระบบสกัดข้อมูลจากภาพ)
*   ใช้ Tesseract.js สำหรับอ่านภาพผลตรวจจากเครื่อง Automate
*   สกัดค่าตัวเลขและนำมากรอกลงแบบฟอร์มให้อัตโนมัติ ลด Human Error

### 3.5 ระบบแจ้งเตือนและข้อความภายใน (Notification & Messaging)
*   **การแจ้งเตือนอัตโนมัติ (Auto Notification):** ทุกครั้งที่สถานะผู้ป่วยเปลี่ยน ระบบจะแจ้งเตือนไปยังผู้รับผิดชอบทุกคนโดยอัตโนมัติ
*   **แจ้งเตือนผลแล็บพร้อม:** เมื่อแล็บบันทึกผลเสร็จ ระบบจะส่งข้อความแจ้งเตือนไปยังแพทย์ผู้รับผิดชอบทันที
*   **ข้อความส่วนตัว (Inbox):** บุคลากรสามารถส่งข้อความหากันได้ รองรับ อ่าน/ตอบ/ลบ/อ่านเป็นกลุ่ม (Bulk)
*   **ตัวเลขแจ้งเตือน (Badge):** แสดงจำนวนข้อความที่ยังไม่อ่านบน Sidebar

### 3.6 ระบบนัดหมาย (Appointment System)
*   สร้างนัดหมายล่วงหน้าพร้อมบันทึกข้อมูล Vital Signs (BP, น้ำหนัก, ส่วนสูง, รอบเอว, ชีพจร, อุณหภูมิ, DTX)
*   ติดตามสถานะนัดหมาย: pending / completed / cancelled / no_show
*   แสดงนัดหมายวันนี้บน Dashboard

### 3.7 ระบบอีเมลอัตโนมัติ (Email Integration)
*   **Password Reset:** ส่งลิงก์รีเซ็ตรหัสผ่านอัตโนมัติ (มีอายุ 15 นาที)
*   **Welcome Email:** ส่งอีเมลต้อนรับเมื่อผู้ใช้ลงทะเบียนสำเร็จ
*   **Account Approved:** แจ้งเตือนเมื่อ Admin อนุมัติบัญชี
*   รองรับทั้ง Gmail และ Custom SMTP Server

### 3.8 ระบบรายงานสถิติ (Admin Reports & Charts)
*   กราฟแยก scope ได้ 5 ระดับ: **รายชั่วโมง / รายวัน / รายสัปดาห์ / รายเดือน / รายปี**
*   แสดงข้อมูล: จำนวนผู้ป่วยกำลังตรวจ, ตรวจเสร็จ, รับผลแล้ว
*   สรุปสถิติภาพรวม: จำนวนบุคลากร, จำนวนผู้ป่วยทั้งหมด, แยกตามสถานะ

## 4. โครงสร้างฐานข้อมูล (Database Schema)

| Table | หน้าที่ |
|-------|---------|
| `users` | ข้อมูลบุคลากร, email, password hash, pin_hash, role, professional_id, bio, status |
| `patients` | ข้อมูลผู้ป่วย (HN, ชื่อ, สกุล, โรค, สถานะ, ข้อมูลติดต่อ, ญาติ) |
| `patient_responsible` | ผู้รับผิดชอบผู้ป่วย (M:N) สำหรับ My Tasks และการแจ้งเตือน |
| `lab_results` | ผลตรวจแล็บ (CBC, Chemistry, Lipid, Urinalysis, Vital Signs) |
| `appointments` | การนัดหมาย + vitals recording |
| `messages` | ข้อความส่วนตัวระหว่างบุคลากร (sender, receiver, subject, content) |
| `notifications` | การแจ้งเตือนอัตโนมัติเมื่อสถานะเปลี่ยน |
| `document_signatures` | ลายมือชื่ออิเล็กทรอนิกส์, QR token, signature_text |
| `print_snapshots` | Frozen snapshot สำหรับ batch printing (ล้างอัตโนมัติ) |
| `login_logs` | บันทึกการเข้าสู่ระบบ (audit trail) |
| `status_histories` | ประวัติการเปลี่ยนสถานะทุกครั้ง (ใคร, เมื่อไหร่, จากสถานะอะไรเป็นอะไร) |

## 5. การจัดการสิทธิ์และการป้องกัน (Security)

### 5.1 Role-Based Access Control (RBAC)
ระบบมี **4 บทบาท** พร้อม Permission Guard ทุกขั้นตอน:

| Role | สิทธิ์หลัก |
|------|------------|
| แพทย์ | ลงทะเบียน, อัปเดตสถานะ, อนุมัติผลตรวจ, ดูผลตรวจ |
| พยาบาล | ลงทะเบียน, อัปเดตสถานะ, จัดส่งตัวอย่าง, พิมพ์ |
| เจ้าหน้าที่ห้องปฏิบัติการ | รับคิว, อัปโหลดผลแล็บ, OCR, พิมพ์ |
| ผู้ดูแลระบบ | ทุกอย่าง + จัดการผู้ใช้ + รายงาน + Debug Role Override |

**Status Workflow Transitions** แต่ละขั้นตอนมี Role Guard:
```
รอตรวจ → นัดหมาย → รอเจาะ → รอจัดส่ง → กำลังจัดส่ง → กำลังตรวจ → เสร็จสิ้น → รายงานผล
```

### 5.2 Server Actions Security
*   ทุก Mutation รันบนเซิร์ฟเวอร์ผ่าน Server Actions — ไม่เปิดเผย Business Logic ให้เบราว์เซอร์
*   Session ถูกตรวจสอบทุกครั้ง (`auth()`) ก่อน Execute

### 5.3 Digital E-Signature & PIN Enforcement
*   ยืนยันด้วย **PIN 6 หลัก** (bcrypt hash) ทุกครั้งที่อนุมัติผล
*   สร้าง Digital Signature พร้อม QR Code Verifier ตีตราประทับบนเอกสาร

### 5.4 การป้องกันเพิ่มเติม
*   **Rate Limiting:** ป้องกัน Brute-force attacks บน API endpoints
*   **Cloudflare Turnstile CAPTCHA:** ป้องกัน Bot ที่หน้า Login/Register
*   **Input Validation:** Zod schema validation ทั้งฝั่ง Client และ Server
*   **Status History Audit:** บันทึกทุกการเปลี่ยนสถานะ (ใคร, เมื่อไหร่, บทบาทอะไร) ลง `status_histories`

## 6. แนวคิดการออกแบบ (Design Patterns)
*   **Server Component Dashboards:** Dashboard และ Admin Panel รันบนเซิร์ฟเวอร์ ส่ง HTML สำเร็จรูปมาแสดงผลทันที (Zero-Layout-Shift)
*   **Component Composition:** โครงร่าง Modular แบ่งเป็น `features`, `layout`, `shared`, `modals`, `patient`, `ui`
*   **Optimistic UI:** ตัวสลับสถานะออกแบบให้แสดงผลทันที แล้วค่อย sync กับเซิร์ฟเวอร์
*   **Frozen Snapshot Pipeline:** ป้องกันข้อมูลเปลี่ยนแปลงระหว่างพิมพ์ โดยแช่แข็ง state ลงฐานข้อมูลก่อน
