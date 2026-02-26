# การวิเคราะห์ระบบและสถาปัตยกรรม (System Analysis & Architecture)

## 1. ภาพรวมของระบบ (System Overview)
**Bloodlink** เป็นเว็บแอปพลิเคชันรูปแบบ Comprehensive Medical Workflow ออกแบบมาเพื่อลดข้อผิดพลาด ลดการใช้งานกระดาษ และติดตามความคืบหน้าของคิวเจาะเลือดไปจนถึงการรายงานผลทางห้องปฏิบัติการ ของคลินิกและโรงพยาบาล

## 2. เทคโนโลยีและสถาปัตยกรรมหลัก (Tech Stack)
*   **Frontend / Framework:** Next.js 14+ (App Router)
*   **Language:** Strict TypeScript
*   **Styling:** Tailwind CSS + Framer Motion (สำหรับ UX UI Animations)
*   **Backend & Database:** Supabase (PostgreSQL) + Prisma ORM
*   **Authentication & Validation:** NextAuth.js (Session JWT), 6-Digit PIN E-Signature System

## 3. ฟีเจอร์แกนกลางและกระบวนการทำงาน (Core Workflows)
1.  **Patient & Pre-Lab Registry:** ระบบลงทะเบียนผู้ป่วยและลงข้อมูลน้ำหนัก ความดัน ซักประวัติเบื้องต้นก่อนเข้าสู่ห้องแล็บ 
2.  **Smart Lab Queue & My Tasks:** คิวงานเทคนิคการแพทย์ที่แยกอิสระ สามารถกด "รับตัว" เพื่อดึงเข้า "งานของฉัน" ป้องกันบุคลากรแย่งกันทำงาน
3.  **Advanced Batch Printing (Snapshot Payload):** สถาปัตยกรรมการพิมพ์ระบบใหม่ ที่บันทึก Payload เข้า Table `print_snapshots` ด้วย Hash ID ชั่วคราว ลดปัญหา Browser RAM Limit และแก้ปัญหา Pop-up blocking ในเบราวเซอร์ ทำให้พิมพ์คิวกลุ่ม 50 คนได้ในคลิกเดียว (A4 Summary + A5 Requests)
4.  **OCR Lab Automation:** ฟิลด์กรอกข้อมูลแล็บที่ทำงานอิงกับระบบจดจำลายนิ้วพิมพ์ (Optical Character Recognition) สำหรับอ่านค่า Automation PDF หรือ Image ให้กรอกลงแบบฟอร์มได้อัตโนมัติ

## 4. โครงสร้างฐานข้อมูล (PostgreSQL DB Schema)
ตารางหลักที่มีความเชื่อมโยงระดับสูง:
*   **`users`**: เก็บข้อมูลผู้ใช้งาน, รหัส PIN, ตำแหน่งงาน (Role), ลายเซ็นต์, และใบประกอบวิชาชีพ
*   **`patients`**: จัดการประวัติคนไข้ขั้นพื้นฐาน ข้อมูลทั่วไป
*   **`appointments` / `status_history`**: บันทึกนัดหมายและการติดตามสถานะแบบ Log Trails ใครเปลี่ยนสถานะ เวลาใด
*   **`lab_results`**: เก็บตัวแปรสถิติทางเลือดทั้งหมด
*   **`print_snapshots`**: (ใหม่) ตารางชั่วคราวในการแช่แข็ง State การทำงานเพื่อนำไปสั่ง Print โดยใช้ Document Hash ID

## 5. การจัดการสิทธิ์และความปลอดภัย (Security & RBAC)
1.  **Role Guard:** บังคับตรวจสอบ Role ทั้งฝั่ง Client และ Server (ผ่าน `src/lib/permissions.ts`) หากพยาบาลมีสิทธิ์เพิ่มผู้ป่วย แต่ไม่มีสิทธิ์กดยืนยันผลแล็บ จะพบการตีกลับ
2.  **Server Actions Guard:** ลดช่องโหว่การโจมตีทาง API โดยเปลี่ยนให้ Component Client ยิงเข้า Server Action ที่มี `auth()` ตรวจสอบผู้เรียก (Caller) หากสิทธิ์ตกหล่นจะ Error ทันที ไม่ยอมให้ Execute SQL
3.  **Digital E-Signature:** ทุกการกดอนุมัติแล็บ (Approve) จะต้องป้อนรหัส 6 หลัก ระบบจะนำไปเช็คคู่กับ Hash PIN ใน Backend สร้าง Timestamp + Token ควบคู่กับ QR Code ตราประทับ

## 6. แนวคิดการออกแบบโครงสร้าง (Design Patterns)
*   **Optimistic UI:** มีการหลอกตาอัปเดตสถานะให้ผู้ใช้รู้สึกว่าระบบทำงานทันที ควบคู่ไปกับการยิง Promise ไปซิ้งค์ข้อมูลหลังบ้าน
*   **Component Composition:** โครงร่าง Modular แบ่งเป็น `features`, `layout`, `shared` ลดความซ้ำซ้อนของโค้ด (DRY Concept)
