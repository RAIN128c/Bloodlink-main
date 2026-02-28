# System Analysis & Architecture: Bloodlink

## 1. System Overview
**Bloodlink** is a high-performance Web Application designed to digitize patient blood test workflows in clinics or regional hospitals. It establishes an untethered link between Patient Registration, Lab Queue Tracking, Result Entry via OCR, Doctor Validation, and Batch Printing processes.

## 2. Technology Stack & Frameworks
*   **Web Framework:** Next.js 16+ (App Router) with React 19
*   **Language:** Strict TypeScript
*   **Styling:** Tailwind CSS + Framer Motion (for fluid micro-interactions)
*   **Backend & Database:** Supabase (PostgreSQL) via Supabase Client
*   **Authentication:** NextAuth.js (Session JWT) + Custom 6-Digit PIN E-Signature System
*   **OCR Engine:** Tesseract.js for automated lab result extraction
*   **Email:** Nodemailer + Resend (Password Reset, Welcome, Account Approved)
*   **Charts:** Recharts for Admin Reports (hourly/daily/weekly/monthly/yearly)
*   **Security:** Rate Limiting, Cloudflare Turnstile CAPTCHA, Zod Input Validation

## 3. Core Modules & Flow
1.  **Patient & Pre-Lab Registry:** Comprehensive digital footprint for vitals, blood pressure, and lab request selection. Supports Bulk Import from Excel/CSV.
2.  **Smart Lab Queue (My Tasks):** MedTechs assume specific queues to avoid job collisions using private task assignment rules (Assignee Binding). Supports Bulk Assign.
3.  **OCR Lab Automation:** Accelerates entries by capturing automated machine printouts and translating them into dynamic form input fields instantly.
4.  **Batch Print Pipelines:** Solves native browser "popup blocking" and RAM crashes by writing deep `Snapshot` hashes into the database prior to spawning A4/A5 print tabs via Server Components.
5.  **Notification & Messaging:** Auto-notifications on status changes, lab result ready alerts, and private messaging between staff with bulk read/unread management.
6.  **Appointment System:** Schedule appointments with Vital Signs recording (BP, weight, height, waist, pulse, temperature, DTX). Track pending/completed/cancelled/no_show.
7.  **Admin Reports:** Statistical charts with 5 scope levels (hour/day/week/month/year) showing patients in-process, tested, and received.
8.  **Email Integration:** Automated emails for password reset, welcome, and account approval via Gmail/Custom SMTP.

## 4. Database Schema (Supabase PostgreSQL)
Top-level structural relations:
*   **`users`**: Admin, Nurse, MedTech, Doctor records with hashed passwords and PINs for digital signing.
*   **`patients`**: Primary medical records bound to unique Hospital Numbers (HN).
*   **`patient_responsible`**: Many-to-many relationship linking staff to patients for My Tasks and notifications.
*   **`lab_results`**: Extensive test metrics (CBC, Chemistry, Lipid, Urinalysis, Vital Signs).
*   **`appointments`**: Scheduling with vitals recording and status tracking.
*   **`messages`**: Private messaging between staff (sender, receiver, subject, content).
*   **`notifications`**: Auto-generated alerts on status changes.
*   **`document_signatures`**: E-Signature records with QR tokens for verification.
*   **`status_histories`**: Immutable audit log trails tracking who updated what status and when.
*   **`print_snapshots`**: Ephemeral payload storage managing asynchronous batch prints.
*   **`login_logs`**: Authentication audit trail.

## 5. Security & Access Control (RBAC)
1.  **4 Roles:** Doctor, Nurse, Lab Staff, Admin — each with granular permission guards enforced both client and server-side.
2.  **Server Actions:** Eliminates vulnerable REST API surfaces by pushing critical mutations via secure Next.js Server Actions bound with `auth()` token verification.
3.  **Digital E-Signature:** Modifying a state to 'Completed' demands a valid 6-digit PIN which undergoes bcrypt verification to generate a timestamped Digital Signature with QR Code.
4.  **Rate Limiting & CAPTCHA:** Prevents brute-force attacks and bot access.
5.  **Input Validation:** Zod schema validation on both client and server sides.

## 6. Development Patterns
*   **Server Component Dashboards:** Dashboard and Admin panels render entirely on the server for zero-layout-shift instant loading.
*   **Optimistic UI:** Used throughout the result approval phase to instantly dissolve patient cards while completing the SQL transaction safely in the background.
*   **Frozen Snapshot Pipeline:** Prevents data drift during printing by freezing state into the database before rendering.
*   **Component Modularity:** Logical slicing of `src/components/features` vs `shared` vs `modals` vs `layout` for adherence to DRY principles.
