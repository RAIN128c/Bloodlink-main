# System Analysis & Architecture: Bloodlink

## 1. System Overview
**Bloodlink** is a high-performance Web Application designed to digitize patient blood test workflows in clinics or hospitals (รพ.สต.). It establishes an untethered link between Patient Registration, Lab Queue Tracking, Result Entry via OCR, Doctor Validation, and Batch Printing processes.

## 2. Technology Stack & Frameworks
*   **Web Framework:** Next.js 14+ (App Router)
*   **Language:** Strict TypeScript
*   **Styling:** Tailwind CSS + Framer Motion (for fluid micro-interactions)
*   **Backend & ORM:** Supabase (PostgreSQL)
*   **Authentication:** NextAuth.js (Session JWT) + Custom 6-Digit PIN E-Signature System

## 3. Core Modules & Flow
1.  **Patient & Pre-Lab Registry:** Comprehensive digital footprint for vitals, blood pressure, and lab request selection.
2.  **Smart Lab Queue (My Tasks):** MedTechs assume specific queues to avoid job collisions using private task assignment rules.
3.  **OCR Lab Automation:** Accelerates entries by capturing automated machine printouts and translating them into dynamic form inputs fields instantly.
4.  **Batch Print Pipelines:** Solves native browser "popup blocking" and RAM crashes by writing deep `Snapshot` hashes into the database prior to spawning A4/A5 PDF print tabs.

## 4. Prisma Relational Schema (ER Diagram Insight)
Top-level structural relations:
*   **`User`**: Admin, Nurse, MedTech records with hashed PINs for digital signing.
*   **`Patient`**: Primary medical records bound to unique Hospital Numbers (HN).
*   **`StatusHistory`**: Immutable log trails tracking who updated what status and when.
*   **`LabResult`**: Extensive test metrics (Chemistry, Hematology) bound to specific queues.
*   **`PrintSnapshot`**: Ephemeral payload storage managing asynchronous batch prints.

## 5. Security & Access Control Infrastructure (RBAC)
1.  **Auth Guard & Role Validations:** Explicit definitions via `RoleGuard` prevent UI leaks.
2.  **Server Actions Guarding:** Eliminates vulnerable REST API surfaces by pushing mission-critical mutations (like Approving Lab Results or altering Patient profiles) directly via secure Next.js Server Actions bound with `auth()` token verification.
3.  **Digital E-Signature Generation:** Modifying a state to 'Completed' demands a valid 6-digit PIN which undergoes Bcrypt parsing to generate a timestamped Digital Signature QR footprint.

## 6. Development Patterns
*   **Optimistic UI:** Used throughout the result approval phase to instantly dissolve patient cards while completing the SQL transaction safely in the background.
*   **Component Modularity:** Logical slicing of `src/components/features` vs `shared` elements for adherence to DRY principles.
