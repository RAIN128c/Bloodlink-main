'use client';

import { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Truck, Droplets, Bug, User } from 'lucide-react';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { Permissions } from '@/lib/permissions';
import { useSession } from 'next-auth/react';

interface HelpButtonProps {
    onNotify?: (type: NotificationType, title: string, message: string, targetPath?: string) => void;
}

// Debug: Override role for testing (stored in sessionStorage)
const ROLE_OVERRIDE_KEY = 'debug_role_override';

export function HelpButton({ onNotify }: HelpButtonProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; body: string }>({ title: '', body: '' });
    const [overrideRole, setOverrideRole] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Check if actual user is Admin (not overridden role)
    const { data: session } = useSession();
    const actualRole = (session?.user as any)?.role;
    const isActualAdmin = Permissions.isAdmin(actualRole);

    // Load override role from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
        if (stored) setOverrideRole(stored);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuItemClick = (type: 'usage' | 'contact' | 'complaint') => {
        const contents = {
            usage: {
                title: 'หัวข้อ',
                body: 'ระบบ BloodLink ช่วยให้คุณสามารถจัดการข้อมูลผู้ป่วย ติดตามผลการตรวจเลือด และนัดหมายได้อย่างสะดวก\n\n1. ใช้แถบค้นหาเพื่อค้นหาผู้ป่วยด้วย HN\n2. ดูประวัติผู้ป่วยได้ที่เมนู "ประวัติผู้ป่วย"\n3. ตรวจสอบนัดหมายได้ที่เมนู "วันนัดหมาย"'
            },
            contact: {
                title: 'การสอบถาม',
                body: 'หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถติดต่อได้ที่:\n\n📧 Email: support@bloodlink.com\n📞 โทร: 02-XXX-XXXX\n🕐 เวลาทำการ: จันทร์-ศุกร์ 08:00-17:00'
            },
            complaint: {
                title: 'ร้องเรียน',
                body: 'หากพบปัญหาหรือต้องการร้องเรียน กรุณาติดต่อ:\n\n📧 Email: complaint@bloodlink.com\n📞 สายด่วน: 1XXX\n\nทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง'
            }
        };
        setModalContent(contents[type]);
        setIsModalOpen(true);
        setIsMenuOpen(false);
    };

    const triggerNotification = (type: NotificationType, title: string, subMessage: string) => {
        if (onNotify) {
            onNotify(type, title, subMessage);
            setIsMenuOpen(false);
        }
    };

    const handleRoleChange = (role: string) => {
        sessionStorage.setItem(ROLE_OVERRIDE_KEY, role);
        setOverrideRole(role);
        // Reload to apply new role
        window.location.reload();
    };

    const handleClearOverride = () => {
        sessionStorage.removeItem(ROLE_OVERRIDE_KEY);
        setOverrideRole(null);
        window.location.reload();
    };

    const ROLE_OPTIONS = [
        { value: 'แพทย์', label: 'แพทย์ (Doctor)', color: 'text-blue-400' },
        { value: 'พยาบาล', label: 'พยาบาล (Nurse)', color: 'text-green-400' },
        { value: 'เจ้าหน้าที่ห้องปฏิบัติการ', label: 'Lab Staff', color: 'text-yellow-400' },
        { value: 'admin', label: 'Admin', color: 'text-red-400' },
    ];

    return (
        <>
            {/* Floating Help Button */}
            <div ref={menuRef} className="fixed bottom-6 right-6 z-50 font-[family-name:var(--font-kanit)] print:hidden">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-12 h-12 rounded-full bg-[#2D3748] text-white shadow-lg hover:bg-[#1F2937] transition-all flex items-center justify-center hover:scale-105"
                    aria-label="Help"
                >
                    <span className="text-xl font-bold">?</span>
                </button>

                {/* Help Menu */}
                {isMenuOpen && (
                    <div className="absolute bottom-14 right-0 w-64 bg-[#2D3748] rounded-[16px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-white px-4 py-3 font-medium text-[13px] border-b border-gray-600 flex items-center gap-2">
                            ช่วยเหลือ
                        </div>

                        {/* Debug Section - Only show to Admin */}
                        {isActualAdmin && (
                            <div className="px-4 py-2 border-b border-gray-600">
                                <button
                                    onClick={() => setIsDebugOpen(!isDebugOpen)}
                                    className="w-full flex items-center justify-between text-[10px] text-gray-400 uppercase font-semibold"
                                >
                                    <span className="flex items-center gap-1">
                                        <Bug className="w-3 h-3" /> Debug Panel
                                    </span>
                                    <span className={`transition-transform ${isDebugOpen ? 'rotate-180' : ''}`}>▼</span>
                                </button>

                                {isDebugOpen && (
                                    <div className="mt-2 space-y-3">
                                        {/* Role Override */}
                                        <div>
                                            <p className="text-[10px] text-gray-400 mb-1">Role Override:</p>
                                            {overrideRole && (
                                                <div className="text-xs text-yellow-400 mb-2 flex items-center justify-between">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        Active: {overrideRole}
                                                    </span>
                                                    <button
                                                        onClick={handleClearOverride}
                                                        className="text-gray-400 hover:text-white text-[10px]"
                                                    >
                                                        ✕ Clear
                                                    </button>
                                                </div>
                                            )}
                                            {ROLE_OPTIONS.map((role) => (
                                                <button
                                                    key={role.value}
                                                    onClick={() => handleRoleChange(role.value)}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-[12px] ${role.color} hover:bg-gray-600 transition-colors ${overrideRole === role.value ? 'bg-gray-600' : ''}`}
                                                >
                                                    {role.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Permission Preview */}
                                        <div className="pt-2 border-t border-gray-600 text-[10px] text-gray-400">
                                            <p>Permissions (current):</p>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                <span className={Permissions.canEditPatient(overrideRole || actualRole || '') ? 'text-green-400' : 'text-red-400'}>
                                                    Patient: {Permissions.canEditPatient(overrideRole || actualRole || '') ? '✓' : '✗'}
                                                </span>
                                                <span className={Permissions.canEditLab(overrideRole || actualRole || '') ? 'text-green-400' : 'text-red-400'}>
                                                    Lab: {Permissions.canEditLab(overrideRole || actualRole || '') ? '✓' : '✗'}
                                                </span>
                                                <span className={Permissions.isAdmin(overrideRole || actualRole || '') ? 'text-green-400' : 'text-red-400'}>
                                                    Admin: {Permissions.isAdmin(overrideRole || actualRole || '') ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Simulate Lab Update */}
                                        <div className="pt-2 border-t border-gray-600">
                                            <p className="text-[10px] text-gray-400 mb-2">Simulate Lab Update:</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                <button
                                                    onClick={() => triggerNotification('resultReady', 'ผลเลือดออก', 'ผลเลือด นางขวัญฤทัย อักษรทอง')}
                                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center"
                                                    title="Result Ready"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                                </button>
                                                <button
                                                    onClick={() => triggerNotification('time', 'ส่งเลือดตรวจ', '')}
                                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center"
                                                    title="Sending Sample"
                                                >
                                                    <Truck className="w-4 h-4 text-blue-400 mx-auto" />
                                                </button>
                                                <button
                                                    onClick={() => triggerNotification('time', 'เจาะเลือด', '')}
                                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center"
                                                    title="Collecting Sample"
                                                >
                                                    <Droplets className="w-4 h-4 text-blue-400 mx-auto" />
                                                </button>
                                                <button
                                                    onClick={() => triggerNotification('sentSuccess', 'ส่งผลเลือดสำเร็จ', '')}
                                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center"
                                                    title="Sent Success"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-[#84CC16] mx-auto" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Standard Menu */}
                        <div className="py-1">
                            <button
                                onClick={() => handleMenuItemClick('usage')}
                                className="w-full px-4 py-2 text-[13px] text-gray-300 hover:bg-[#374151] transition-colors text-left"
                            >
                                วิธีการใช้งาน
                            </button>
                            <button
                                onClick={() => handleMenuItemClick('contact')}
                                className="w-full px-4 py-2 text-[13px] text-gray-300 hover:bg-[#374151] transition-colors text-left"
                            >
                                การสอบถาม
                            </button>
                            <button
                                onClick={() => handleMenuItemClick('complaint')}
                                className="w-full px-4 py-2 text-[13px] text-gray-300 hover:bg-[#374151] transition-colors text-left"
                            >
                                ร้องเรียน
                            </button>
                        </div>

                        {/* Session Role Debug Info */}
                        <div className="px-4 py-2 border-t border-gray-600 text-[10px] text-gray-500 text-center">
                            Role: {actualRole || 'None'} {isActualAdmin ? '(Admin)' : ''}
                        </div>
                    </div>
                )}
            </div>

            {/* Help Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center font-[family-name:var(--font-kanit)]">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-md p-6">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[20px] font-bold text-[#1E1B4B] dark:text-white mb-4">{modalContent.title}</h2>
                        <div className="text-[14px] text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                            {modalContent.body}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
