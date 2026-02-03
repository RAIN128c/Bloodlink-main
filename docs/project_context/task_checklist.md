# Task Checklist: Lab System Overhaul

## Phase 1: Data Layer & Services
- [/] Update `LabResult` interface in `labService.ts` <!-- id: 0 -->
- [/] Update `getLabHistory` mapping <!-- id: 1 -->
- [/] Update `addLabResult`/`update` logic <!-- id: 2 -->

## Phase 2: UI Implementation
- [x] Update local types in `page.tsx` <!-- id: 3 -->
- [x] Implement Vital Signs Input/Display Section <!-- id: 4 -->
- [x] Implement Chemistry & Urine Input/Display Rows <!-- id: 5 -->
- [x] Implement Specimen Status Input <!-- id: 6 -->
- [x] **Sync Admin Settings**: Create `seed_lab_ranges.sql` <!-- id: 13 -->
- [x] **Organize Lab Settings**: Group by Category & Clean UI (No Icons) <!-- id: 14 -->
- [x] **Vital Signs Display**: Add Units (mmHg, bpm, etc.) <!-- id: 15 -->

## Phase 3: Print Layout Optimization - OVERHAUL V2 (Balanced)
- [x] Revert "Nuclear" Zoom to Balanced (0.9) <!-- id: 7 -->
- [x] **Header Redesign**: Medical Report Style (2-column info) <!-- id: 8 -->
- [x] **Result Table**: Standard padding (py-1), clear font <!-- id: 9 -->
- [x] **Vital Signs**: Grid layout, 5-column responsive <!-- id: 10 -->
- [x] **Footer**: Signature area with "Reporter/Approver" <!-- id: 11 -->

## Phase 4: Request vs Result Separation <!-- id: 16 -->
- [x] **Database**: Add `doctor_name`, `department`, `diagnosis` to `lab_results` <!-- id: 17 -->
- [x] **UI Logic**: Add Tab/Mode Switcher (Request / Result) in `results/[hn]/page.tsx` <!-- id: 18 -->
- [x] **Request View**: Implement "Lab Request Form" layout with checklist & new fields <!-- id: 19 -->
- [x] **Refactor**: Move Vital Signs Input to Request Tab <!-- id: 21 -->
- [x] **Refactor**: Implement Read-Only Vital Signs in Result Tab <!-- id: 22 -->
- [x] **Refactor**: Split Result Table into CBC, Chemistry, and Urinalysis tables <!-- id: 23 -->
- [x] **Result View**: Keep existing "Lab Report" layout <!-- id: 20 -->
- [/] Implement "Medical Report" Header (Clean & Professional) <!-- id: 8 -->
- [/] Refine Table Spacing (Readable but Compact) <!-- id: 9 -->

## Phase 4: Print Overhaul
- [x] **Header**: Implement Formal Report Header (Logo, Patient Grid) <!-- id: 24 -->
- [x] **Layout**: CSS Print Media Query Overhaul (A4 Optimization) <!-- id: 25 -->
- [x] **Content**: Hide Non-Report Elements (Tabs, Inputs) <!-- id: 26 -->
- [x] **Footer**: Formal Signature Block & End Marker <!-- id: 27 -->

## Phase 4: Verification
- [x] Verify Data Persistence <!-- id: 10 -->
- [x] Verify Single Page Fit <!-- id: 11 -->

## Phase 5: Print Summary Feature <!-- id: 28 -->
- [x] **Database**: Create `schema_update_v5` for patient details <!-- id: 29 -->
- [x] **Data Layer**: Update `Patient` type and `PatientService` <!-- id: 30 -->
- [x] **UI Component**: Create `PrintSummarySheet` component <!-- id: 31 -->
- [x] **Integration**: Add "Print Summary" to `PatientList` <!-- id: 32 -->

## Phase 6: Patient Data Enhancement (Consultant Feedback)
- [ ] **Registration Form (`/patients/add`)**
    - [x] Add `idCard` input (13 digits, numeric only)
    - [x] Add `phone` input (Masked/Formatted)
    - [x] Add `relativeName`, `relativePhone`, `relativeRelationship` inputs
    - [x] **Validation**: Mandatory fields for NCD context
    - [x] **UX**: Emergency Contact Toggle? (Or clear labelling)
    - [x] **Multi-select Test Type**: Replace Dropdown with Checkboxes (CBC, Chem, HbA1c, Lipid, Urine)
- [ ] **Patient Detail (`/history/[hn]`)**
    - [x] **Display**: Show Contact & Relative info in Profile Card
    - [x] **Action**: Click-to-call links (`tel:`)
    - [x] **Edit**: Implement "Edit Profile" feature for these fields
- [ ] **Lab Result (`/results/[hn]`)**
    - [x] **Header**: Add ID Card (masked on screen, full on print)
