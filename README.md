# Bloodlink (v0.9.3)

**Bloodlink** is a comprehensive Web Application designed for managing patient blood test workflows in a clinic or laboratory setting. It facilitates the entire process from patient registration to result delivery.

## Key Features
*   **Patient Management:** Registration, Queue Tracking, History.
*   **Lab Information System (LIS):** Result Entry, Validation, Reference Ranges.
*   **Role-Based Access Control:** Admin, Doctor, MedTech, Nurse.
*   **Real-time Notifications:** Instant alerts for status updates.

## Documentation (เอกสารประกอบ)
Detailed documentation regarding system analysis, architecture, and development methodology can be found in the `docs/` folder:
เอกสารรายละเอียดเกี่ยวกับระบบ การวิเคราะห์ และวิธีการพัฒนา สามารถดูได้ที่โฟลเดอร์ `docs/`:

### Thai Documents (เอกสารภาษาไทย)
*   **[คู่มือการใช้งาน (User Manual)](docs/USER_MANUAL_TH.md):** ขั้นตอนการใช้งานสำหรับ แพทย์, เจ้าหน้าที่แล็บ, และแอดมิน
*   **[การวิเคราะห์ระบบ (System Analysis)](docs/SYSTEM_ANALYSIS_TH.md):** รายละเอียดเชิงเทคนิค, ER Diagram, และโครงสร้างระบบ
*   **[รายละเอียดและวิธีการดำเนินงาน (Context & Methodology)](docs/PROJECT_CONTEXT_TH.md):** ทฤษฎีที่เกี่ยวข้องและขั้นตอนการพัฒนา
*   **[ตัวอย่างโค้ด (Code Examples)](docs/CODE_EXAMPLES_TH.md):** ตัวอย่างการทำงานของโค้ดส่วนสำคัญ

### English Documents
*   **[System Analysis & Architecture](docs/SYSTEM_ANALYSIS_EN.md):** Technical overview, schema, and security architecture.

## Tech Stack
*   **Framework:** Next.js (App Router)
*   **Database:** Supabase (PostgreSQL)
*   **Styling:** Tailwind CSS + Shadcn UI
*   **Auth:** NextAuth.js

## Setup & Deployment
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set up environment variables (`.env`).
4.  Run development server: `npm run dev`