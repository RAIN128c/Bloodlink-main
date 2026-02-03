# implementation_plan.md

# Lab System Overhaul: Vital Signs, Extended Labs, and Print Layout

## User Objective
The goal is to expand the current CBC-only lab system to support a comprehensive health checkup format, including Vital Signs, Clinical Chemistry, Lipid Profile, and Urinalysis. Additionally, the system must generate a professional, **single-page** print report.

## Baseline Status
- **Database:** Schema updated with new columns (`weight`, `height`, `bp`, `fbs`, etc.) (Confirmed by user).
- **Codebase:** Reverted to CBC-only state. `LabResult` interfaces and Service mappings need updating.
- **UI:** Needs standard input forms and a new optimized print layout.

## Phase 1: Data Layer & Services
Update the application logic to handle the expanded data schema.

#### [MODIFY] src/lib/services/labService.ts
- Update `LabResult` interface to include:
  - **Vital Signs:** `weight`, `height`, `waist_line`, `bmi`, `bp_sys`, `bp_dia`, `pulse`, `respiration`, `temperature`.
  - **Chemistry:** `fbs`, `uric_acid`, `ast`, `alt`, `cholesterol`, `triglyceride`, `hdl`, `ldl`.
  - **Urine:** `urine_albumin`, `urine_sugar`.
  - **Meta:** `specimen_status`.
- Update `getLabHistory`: Map database columns to the new interface.
- Update `addLabResult` / `updateLabResult`: Ensure new fields are persisted.

## Phase 2: Frontend Logic & Input
Enable users to input and edit the new data fields.

#### [MODIFY] src/app/results/[hn]/page.tsx
- Update local `LabResult` interface to match the service.
- **Edit Mode:**
  - Add input sections for Vital Signs (Grid layout).
  - Add input rows for Chemistry and Urinalysis in the main table or separate sections.
  - Add Specimen Status selector.
- **View Mode:**
  - Display Vital Signs prominently (e.g., top card).
  - Group Lab Tests logically (CBC, Chemistry, Urine).

## Phase 3: Professional Print Layout
Create a specific print view that fits all information on a single A4 page.

#### [MODIFY] src/app/globals.css
- Refine `@media print` styles.
- Ensure standard margins (0.5cm) for browser compatibility.
- formatting utilities for print-specific visibility (`.print-only`, `.print-hidden`).

#### [MODIFY] src/app/results/[hn]/page.tsx
- **Header Structure:**
  - Implement "Split Header": Hospital Name (Left) | Date (Right).
  - Patient Info: 1-row Grid (HN, Name, Age, Gender).
- **Content Density:** line-height and padding adjustments for print mode only.
- **Logic:** Hide actionable buttons and sidebar during print.

## Verification Plan
### Manual Verification
1.  **Data Flow:** Enter full set of data -> Save -> Refresh -> Verify data persists.
2.  **Print Preview:**
    - Open Print dialog.
    - Verify content fits on 1 page (Portrait).
    - Verify no "squeezed" or broken text.
    - Verify Hospital Header appears correctly.

## Phase 5: Print Summary Feature (History Page)
Implements a physical checklist tool for lab operations.

#### [NEW] docs/schema_update_v5_patient_details.sql
- Add columns: `id_card`, `phone`, `relative_name`, `relative_phone`, `relative_relationship`.

#### [MODIFY] src/lib/services/patientService.ts
- Update `Patient` interface.
- Implement data fetching for new columns.

#### [NEW] src/components/features/history/PrintSummarySheet.tsx
- A4 Portrait/Landscape layout.
- Limit to 10 rows.
- Fields: No, Name, HN, Diagnosis, Checkboxes, ID Card, Phone, Relative.

#### [MODIFY] src/components/features/history/PatientList.tsx
- Add "Print Summary" button.
- Logic to pass selected patients to print view.

## Phase 6: Patient Data Enhancement (Consultant Feedback)
Focus on data completeness, validation, and actionable usage.

#### [MODIFY] src/components/patient/PatientForm.tsx
- Add `idCard` (13 digits), `phone` (masked), `relativeName`, `relativePhone`, `relativeRelationship`.
- Implement strict validation for ID Card and mandatory contact fields for NCD.
- Add `idCard` (13 digits), `phone` (masked), `relativeName`, `relativePhone`, `relativeRelationship`.
- Implement strict validation for ID Card and mandatory contact fields for NCD.
- Add "Patient Uses Relative Phone" checkbox logic.
- **Test Type Selection**: Replace single-select dropdown with Multi-select Checkbox Group (CBC, Chemistry, HbA1c, Lipid Profile, Urinalysis). Store as comma-separated string.

#### [MODIFY] src/app/results/[hn]/page.tsx
- Add ID Card to the formal print header ("Medical Report" style).

#### [MODIFY] src/components/features/history/PatientDetail.tsx
- **Display**: Show full contact/relative info in the profile card.
- **Action**: Add `tel:` links for click-to-call functionality.
- **Edit**: Implement capability to edit these new fields (and name/surname).
