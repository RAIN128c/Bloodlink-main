'use client';

import { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Truck, Droplets, Bug, User, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { NotificationType } from '@/components/shared/NotificationPopup';
import { Permissions } from '@/lib/permissions';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { HELP_CONTENT } from '@/config/helpData';

interface HelpButtonProps {
    onNotify?: (type: NotificationType, title: string, message: string, targetPath?: string) => void;
}

// Debug: Override role for testing (stored in sessionStorage)
const ROLE_OVERRIDE_KEY = 'debug_role_override';

export function HelpButton({ onNotify }: HelpButtonProps) {
    const pathname = usePathname();
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
        if (type === 'usage') {
            // Context-aware help
            const pathKey = Object.keys(HELP_CONTENT.routes).find(route => pathname.startsWith(route)) || 'general';
            // Use specific route content if match, otherwise general, but allow strict general fallback if needed
            // Logic: if exact match or partial match found in config, use it. Else use general.
            // Improved Logic: Check for longest matching prefix
            const matchedRoute = Object.keys(HELP_CONTENT.routes)
                .filter(route => pathname.startsWith(route))
                .sort((a, b) => b.length - a.length)[0];

            const content = matchedRoute ? HELP_CONTENT.routes[matchedRoute] : HELP_CONTENT.general;

            setModalContent(content);
        } else if (type === 'contact') {
            // Formatted contact info
            const { contact } = HELP_CONTENT;
            setModalContent({
                title: 'ช่องทางติดต่อ (Contact)',
                body: '' // Using custom render for contact
            });
        } else if (type === 'complaint') {
            const { complaint } = HELP_CONTENT;
            setModalContent({
                title: complaint.title,
                body: `${complaint.body}\n\n📧 ${complaint.email}`
            });
        }

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
        { value: 'ผู้ดูแล', label: 'Admin', color: 'text-red-400' },
    ];

    // Helper to render body content (handles strict string or custom JSX injection if we extended it, currently using string)
    // For Contact, we'll render specifically in the modal
    const isContactModal = modalContent.title === 'ช่องทางติดต่อ (Contact)';

    // Simple parser for **bold** text
    const formatContent = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*{2}.*?\*{2})/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={index} className="font-bold text-gray-900 dark:text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

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
                            ช่วยเหลือ (Help)
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
                                            <p className="font-semibold mb-1">General Permissions:</p>
                                            <div className="flex gap-2 flex-wrap">
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

                                        {/* Status Workflow Permissions */}
                                        <div className="pt-2 border-t border-gray-600 text-[10px] text-gray-400">
                                            <p className="font-semibold mb-1">Status Workflow:</p>
                                            <div className="space-y-1">
                                                {[
                                                    { from: 'รอตรวจ', to: 'นัดหมาย', label: 'รอตรวจ→นัดหมาย' },
                                                    { from: 'นัดหมาย', to: 'เจาะเลือด', label: 'นัดหมาย→เจาะเลือด' },
                                                    { from: 'เจาะเลือด', to: 'กำลังจัดส่ง', label: 'เจาะเลือด→จัดส่ง' },
                                                    { from: 'กำลังจัดส่ง', to: 'กำลังตรวจ', label: 'จัดส่ง→กำลังตรวจ' },
                                                    { from: 'กำลังตรวจ', to: 'เสร็จสิ้น', label: 'กำลังตรวจ→เสร็จ' },
                                                ].map(({ from, to, label }) => {
                                                    const currentRole = overrideRole || actualRole || '';
                                                    const canDo = Permissions.canUpdateToStatus(currentRole, from, to);
                                                    const requiredRole = Permissions.getRequiredRoleForTransition(from, to);
                                                    return (
                                                        <div key={label} className="flex items-center justify-between">
                                                            <span className={canDo ? 'text-green-400' : 'text-gray-500'}>
                                                                {canDo ? '✓' : '✗'} {label}
                                                            </span>
                                                            {!canDo && (
                                                                <span className="text-[8px] text-gray-500">
                                                                    ({requiredRole})
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
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
                                วิธีการใช้งาน (Guide)
                            </button>
                            <button
                                onClick={() => handleMenuItemClick('contact')}
                                className="w-full px-4 py-2 text-[13px] text-gray-300 hover:bg-[#374151] transition-colors text-left"
                            >
                                การสอบถาม (Contact)
                            </button>
                            <button
                                onClick={() => handleMenuItemClick('complaint')}
                                className="w-full px-4 py-2 text-[13px] text-gray-300 hover:bg-[#374151] transition-colors text-left"
                            >
                                ร้องเรียน (Complaint)
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center font-[family-name:var(--font-kanit)] p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="text-[18px] font-bold text-[#1E1B4B] dark:text-white">
                                {modalContent.title}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-1 rounded-full shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {isContactModal ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email Support</p>
                                            <a href={`mailto:${HELP_CONTENT.contact.email}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline block break-all">
                                                {HELP_CONTENT.contact.email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl flex items-start gap-4">
                                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg text-green-600 dark:text-green-300">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Call Center</p>
                                            <a href={`tel:${HELP_CONTENT.contact.phone}`} className="text-green-600 dark:text-green-400 font-medium hover:underline block">
                                                {HELP_CONTENT.contact.phone}
                                            </a>
                                        </div>
                                    </div>

                                    {HELP_CONTENT.contact.lineId && (
                                        <div className="bg-[#06C755]/10 p-4 rounded-xl flex items-start gap-4">
                                            <div className="p-2 bg-[#06C755]/20 rounded-lg text-[#06C755]">
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Line ID</p>
                                                <p className="text-[#06C755] font-medium">
                                                    {HELP_CONTENT.contact.lineId}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 justify-center">
                                        <Clock className="w-4 h-4" />
                                        <span>{HELP_CONTENT.contact.hours}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[14px] text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                    {formatContent(modalContent.body)}

                                    {modalContent.title.includes('ร้องเรียน') && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <a
                                                href={`mailto:${HELP_CONTENT.complaint.email}`}
                                                className="block w-full text-center py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium text-sm"
                                            >
                                                ส่งเรื่องร้องเรียน (Send Email)
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
