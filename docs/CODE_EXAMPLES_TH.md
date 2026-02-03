# ตัวอย่างโค้ดที่สำคัญ (Code Examples)

ส่วนนี้รวบรวมตัวอย่างโค้ดส่วนหัวใจหลัก (Core Logic) ของระบบ

## 1. การจัดการข้อมูลผลแล็บ (Backend Logic)
ไฟล์: `src/lib/services/labService.ts`
ตัวอย่างฟังก์ชันการอัปเดตผลเลือดและส่งแจ้งเตือน:

```typescript
static async updateLabResult(hn: string, data: Partial<LabResult>, notifyDoctor: boolean = false) {
    // 1. ตรวจสอบและดึงข้อมูลเดิม
    const { data: existing } = await supabase
        .from('lab_results')
        .eq('hn', hn)
        .maybeSingle();

    // 2. บันทึกข้อมูลใหม่
    await supabase.from('lab_results').update(data).eq('id', existing.id);

    // 3. แจ้งเตือนแพทย์ (Real-time)
    if (notifyDoctor) {
        await NotificationService.sendLabResultReadyNotification(hn, "Lab Results Ready");
    }
}
```

## 2. การแสดงผลตาราง (Frontend UI)
ไฟล์: `src/app/results/[hn]/page.tsx`
ตัวอย่างการตรวจสอบค่าผิดปกติตามช่วง (Reference Range):

```typescript
const renderTestRow = (test: LabRange) => {
    const value = labResults?.[test.test_key];
    const rangeStr = `${test.min_value} - ${test.max_value}`;
    
    // Logic ตรวจสอบ: ถ้าค่าอยู่นอกช่วง จะเป็น True
    const isAbnormal = checkAbnormal(value, rangeStr);

    return (
        <tr className="border-b">
            <td>{test.test_name}</td>
            <td>
                {/* แสดงสีแดงถ้าผิดปกติ */}
                <LabAlert isAbnormal={isAbnormal} val={String(value)} />
            </td>
            <td>{test.unit}</td>
            <td>{rangeStr}</td>
        </tr>
    );
};
```

## 3. ระบบความปลอดภัย (Security Guard)
ไฟล์: `src/components/providers/RoleGuard.tsx`
ตัวอย่าง Component ที่ใช้ป้องกันหน้าจอสำหรับคนไม่มีสิทธิ์:

```typescript
export function RoleGuard({ children, allowedRoles }) {
    const { data: session } = useSession();

    // ตรวจสอบ Role ของผู้ใช้ปัจจุบัน เทียบกับ Role ที่อนุญาต
    if (!allowedRoles.includes(session?.user?.role)) {
        return <div>Access Denied (คุณไม่มีสิทธิ์เข้าถึงหน้านี้)</div>;
    }

    return <>{children}</>;
}
```
