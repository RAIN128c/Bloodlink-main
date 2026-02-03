# Patient Data & Print Enhancements Walkthrough

## 1. Patient Registration Enhancement
**Page:** `/patients/add`

### 1.1 New Fields Validation
- **Action:** Try to add a new patient.
- **Check (ID Card):**
  - Enter a non-numeric character -> Should not appear.
  - Enter 12 digits -> Should show error "ต้องมี 13 หลัก".
  - Enter 13 digits -> Should show "✓ ครบ 13 หลัก".
- **Check (Relative Info):**
  - Try to submit without "Relative Name", "Phone", or "Relationship".
  - **Verify:** Validation error prevents submission (Mandatory for NCD tracking).

### 1.2 "Use Relative Phone" Toggle
- **Action:** Check "ไม่มีเบอร์ส่วนตัว (ใช้เบอร์ญาติ)".
- **Verify:** Patient phone field clears or disabled (optional check), user understands to fill relative phone.

## 2. Patient History & Edit
**Page:** `/history/[hn]`

### 2.1 Contact Display
- **Check:** Verify the "Profile Card" (Left side) now allows scrolling or displays:
  - ID Card: `1234567890123`
  - Phone: `081-234-5678` (Clickable Link `tel:`)
  - **Relative Section:** Distinct block with Name, Relation, and Clickable Phone.

### 2.2 Edit Capability
- **Action:** Click "แก้ไขข้อมูล" (Edit Data).
- **Test:** Change the "Relative Phone". Save.
- **Verify:** The new number appears immediately and the `tel:` link updates.

## 3. Lab Report Print Header
**Page:** `/results/[hn]`

### 3.1 ID Card on Print
- **Action:** Click Print (or Ctrl+P).
- **Check:** Look at the Header section.
- **Verify:** Next to **HN**, you should now see **ID: [ID Card Number]**.
  - Screen: May look compact or masked.
  - Print Preview: Should be clearly visible for official use.
