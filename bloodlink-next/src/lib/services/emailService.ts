import nodemailer from 'nodemailer';

// Configure Transport logic: Support both Gmail and Custom SMTP
const smtpOptions = process.env.EMAIL_HOST
    ? {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    }
    : {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    };

const transporter = nodemailer.createTransport({
    ...smtpOptions,
    debug: true, // Show debug output
    logger: true  // Log details to console
} as any);

const getBaseUrl = () => {
    if (process.env.AUTH_URL) return process.env.AUTH_URL;
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
    return 'http://localhost:3000';
};

export const EmailService = {
    sendPasswordResetEmail: async (toEmail: string, token: string) => {
        const resetLink = `${getBaseUrl()}/reset-password?token=${token}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #7c3aed; margin: 0;">BloodLink</h1>
                    <p style="color: #666; margin-top: 5px;">ระบบจัดการข้อมูลผู้ป่วยและการตรวจเลือด</p>
                </div>
                
                <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                    <h2 style="color: #1f2937; margin-top: 0;">รีเซ็ตรหัสผ่าน</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ (${toEmail})<br>
                        หากคุณเป็นผู้ส่งคำขอนี้ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            ตั้งรหัสผ่านใหม่
                        </a>
                        <p style="color: #dc2626; font-size: 14px; margin-top: 15px; font-weight: bold;">
                            * ลิงก์นี้มีอายุการใช้งาน 15 นาที
                        </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของคุณ:<br>
                        <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
                    </p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>หากคุณไม่ได้ส่งคำขอนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้ บัญชีของคุณยังคงปลอดภัย</p>
                    <p>&copy; ${new Date().getFullYear()} BloodLink System. All rights reserved.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: `"BloodLink System" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: 'BloodLink: คำขอรีเซ็ตรหัสผ่าน (Reset Password)',
                html: htmlContent,
            });
            console.log(`Email sent successfully to ${toEmail}`);
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: 'Failed to send email' };
        }
    },

    sendWelcomeEmail: async (toEmail: string, name: string) => {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #7c3aed; margin: 0;">BloodLink</h1>
                    <p style="color: #666; margin-top: 5px;">ระบบจัดการข้อมูลผู้ป่วยและการตรวจเลือด</p>
                </div>
                
                <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                    <h2 style="color: #1f2937; margin-top: 0;">ยินดีต้อนรับ, ${name}</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        ขอบคุณสำหรับการสมัครสมาชิก BloodLink<br>
                        บัญชีของคุณอยู่ระหว่างการตรวจสอบโดยผู้ดูแลระบบ (Admin)<br>
                        คุณจะได้รับอีเมลแจ้งเตือนอีกครั้งเมื่อบัญชีได้รับการอนุมัติ
                    </p>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>กรุณารอการตรวจสอบภายใน 24 ชั่วโมง</p>
                    <p>&copy; ${new Date().getFullYear()} BloodLink System. All rights reserved.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: `"BloodLink System" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: 'BloodLink: การลงทะเบียนของคุณได้รับแล้ว (รอการอนุมัติ)',
                html: htmlContent,
            });
            console.log(`Welcome email sent to ${toEmail}`);
            return { success: true };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error: 'Failed to send email' };
        }
    },

    sendAccountApprovedEmail: async (toEmail: string, name: string) => {
        const loginLink = `${getBaseUrl()}/login`;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #7c3aed; margin: 0;">BloodLink</h1>
                    <p style="color: #666; margin-top: 5px;">ระบบจัดการข้อมูลผู้ป่วยและการตรวจเลือด</p>
                </div>
                
                <div style="padding: 20px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <h2 style="color: #166534; margin-top: 0;">บัญชีของคุณได้รับการอนุมัติแล้ว!</h2>
                    <p style="color: #374151; line-height: 1.6;">
                        สวัสดีคุณ ${name},<br>
                        ผู้ดูแลระบบได้อนุมัติบัญชีของคุณเรียบร้อยแล้ว<br>
                        คุณสามารถเข้าสู่ระบบเพื่อเริ่มใช้งานได้ทันที
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            เข้าสู่ระบบ
                        </a>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p>หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ</p>
                    <p>&copy; ${new Date().getFullYear()} BloodLink System. All rights reserved.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: `"BloodLink System" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: 'BloodLink: บัญชีของคุณได้รับการอนุมัติแล้ว (Account Approved)',
                html: htmlContent,
            });
            console.log(`Approved email sent to ${toEmail}`);
            return { success: true };
        } catch (error) {
            console.error('Error sending approved email:', error);
            return { success: false, error: 'Failed to send email' };
        }
    }
};
