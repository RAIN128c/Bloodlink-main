# Security Policy

## Supported Versions

ทางทีมผู้พัฒนา Bloodlink จะดูแลและอัปเดตแพทช์ความปลอดภัยให้กับเวอร์ชันล่าสุดที่ใช้งานอยู่บน Production เท่านั้น:

| Version | Supported          | Notes                                     |
| ------- | ------------------ | ----------------------------------------- |
| V1.x.x  | :white_check_mark: | Active Development & Production (Next.js) |
| V0.x.x  | :x:                | Legacy Express.js (Deprecated)            |

## Reporting a Vulnerability (การรายงานช่องโหว่)

เนื่องจากระบบนี้เป็นระบบจัดการข้อมูลผู้ป่วยทางการแพทย์ (Health Information System) ความปลอดภัยและข้อมูลส่วนบุคคล (PDPA/HIPAA) จึงเป็นสิ่งสำคัญสูงสุด

หากท่านพบช่องโหว่ด้านความปลอดภัยใดๆ **กรุณาอย่าเปิดเผยต่อสาธารณะ (Do not create a public issue)**

กรุณารายงานช่องโหว่มาหาเราโดยตรงผ่านช่างทาง private:
- 📧 ติดต่อผู้ดูแลระบบ (Admin) โดยตรง
- 🛡️ หรือรายงานผ่านแถบ **Security Advisories** ของ Repository นี้ (ถ้าได้รับสิทธิ์)

### สิ่งที่ควรแนบมาด้วย:
1. ประเภทของช่องโหว่ (เช่น XSS, SQLi, Authorization bypass)
2. ขั้นตอนในการทำให้เกิดช่องโหว่ซ้ำ (Steps to reproduce)
3. ผลกระทบที่อาจเกิดขึ้น (Potential impact)

ทางทีมงานจะตอบกลับภายใน 24-48 ชั่วโมงเพื่อประเมินและทำการแก้ไข (Hotfix) ทันที
