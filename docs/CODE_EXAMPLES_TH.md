# ตัวอย่างโค้ดที่สำคัญ (Core Code Architecture Examples)

ส่วนนี้รวบรวมโครงสร้างโค้ดหลักล่าสุดในระดับ Production เพื่อเป็น Reference 

## 1. ระบบลายเซ็นอิเล็กทรอนิกส์ & การประทับเวลา (E-Signature Server Action)
ไฟล์: `src/lib/actions/patient.ts`
ใช้สำหรับตรวจสอบ PIN และลงนามในใบส่งตรวจแบบดิจิทัล:

```typescript
'use server'

export async function approveLabResultAction({ hn, pin }: { hn: string, pin: string }) {
    // 1. ตรวจสอบสิทธิ์ (Authentication Check)
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // 2. ดึงข้อมูล User และตรวจสอบ PIN
    const user = await prisma.user.findUnique({ where: { email: session.user.email }});
    const isValidPin = await bcrypt.compare(pin, user.pinHash);
    
    if (!isValidPin) {
        return { success: false, error: "Invalid PIN" };
    }

    // 3. สร้างตราประทับ Digital Signature
    const signatureToken = generateSignatureToken(user.id, hn);
    
    // 4. บันทึกผลเลือด (Database Transaction)
    await prisma.patient.update({
        where: { hn },
        data: {
            process: 'เสร็จสิ้น',
            signatureToken,
            approvedBy: user.id
        }
    });

    return { success: true };
}
```

## 2. โครงสร้างการส่งพิมพ์แบบ Snapshot (Batch Printing API)
ไฟล์: `src/app/api/print-batch/route.ts`
ระบบสำหรับหลีกเลี่ยงข้อจำกัดเบราว์เซอร์เมื่อต้องพิมพ์ข้อมูลจำนวนมาก ๆ:

```typescript
export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const payload = await req.json();
    
    // 1. สร้างรหัส Hash ชั่วคราว
    const snapshotHash = crypto.randomBytes(16).toString('hex');

    // 2. บันทึกข้อมูลลงตาราง print_snapshots แบบแช่แข็ง State
    await supabaseAdmin
        .from('print_snapshots')
        .insert({
            hash: snapshotHash,
            data: payload, // เก็บ JSON อาเรย์ของข้อมูลทั้งหมด
            created_by: session.user.email,
            expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString() // หมดอายุใน 15 นาที
        });

    // 3. แนบ Hash กลับไปให้ Client สั่งเปิด Tab ใหม่
    return NextResponse.json({ success: true, hash: snapshotHash });
}
```

## 3. ระบบอ่านข้อมูลภาพ OCR อัตโนมัติในฝั่งหน้าบ้าน
ไฟล์: `src/components/features/results/ImportResultModal.tsx`

```tsx
const handleUploadImage = async (file: File) => {
    setIsScanning(true);
    try {
        // อัปโหลดฝั่ง Client ไปยังตัวจำแนกอักษร
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData
        });

        const extractedData = await response.json();
        
        // ผูกค่าที่ได้กลับเข้าตาราง
        if(extractedData.success) {
            onFieldsExtracted(extractedData.fields);
            toast.success("ดึงข้อมูลตัวเลขสำเร็จ กรุณาตรวจสอบอีกครั้ง");
        }
    } catch (e) {
        toast.error("สแกนล้มเหลว");
    } finally {
        setIsScanning(false);
    }
}
```
