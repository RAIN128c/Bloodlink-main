'use client';

import { useState, useEffect } from 'react';
import { X, Users, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Patient } from '@/types';

interface BulkAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPatients: Patient[];
    onAssignComplete: () => void;
}

interface StaffMember {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
}

export function BulkAssignModal({ isOpen, onClose, selectedPatients, onAssignComplete }: BulkAssignModalProps) {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStaff, setIsFetchingStaff] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch staff when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchStaff();
        }
    }, [isOpen]);

    const fetchStaff = async () => {
        setIsFetchingStaff(true);
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                // Filter to only doctors and nurses
                const staff = data.filter((u: StaffMember) =>
                    u.role === 'แพทย์' || u.role === 'พยาบาล'
                );
                setStaffList(staff);
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        } finally {
            setIsFetchingStaff(false);
        }
    };

    const filteredStaff = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssign = async () => {
        if (!selectedStaff || selectedPatients.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/patients/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientHns: selectedPatients.map(p => p.hn),
                    staffEmail: selectedStaff.email
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Assignment failed');
            }

            setResult(data);

            if (data.success > 0) {
                onAssignComplete();
            }
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedStaff(null);
        setSearchQuery('');
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm font-[family-name:var(--font-kanit)] modal-backdrop">
            <div className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[500px] max-h-[85vh] mx-4 shadow-2xl overflow-hidden flex flex-col modal-content">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        มอบหมายผู้รับผิดชอบ
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Selected Patients Summary */}
                    <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            <span className="font-semibold">{selectedPatients.length}</span> ผู้ป่วยที่เลือก
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {selectedPatients.slice(0, 3).map(p => `${p.name} ${p.surname}`).join(', ')}
                            {selectedPatients.length > 3 && ` และอีก ${selectedPatients.length - 3} คน`}
                        </p>
                    </div>

                    {!result && (
                        <>
                            {/* Search Staff */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาแพทย์/พยาบาล..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Staff List */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                                {isFetchingStaff ? (
                                    <div className="flex items-center justify-center py-8 text-gray-500">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        กำลังโหลด...
                                    </div>
                                ) : filteredStaff.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                        ไม่พบรายชื่อ
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredStaff.map((staff) => (
                                            <button
                                                key={staff.id}
                                                onClick={() => setSelectedStaff(staff)}
                                                className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedStaff?.id === staff.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${staff.role === 'แพทย์' ? 'bg-blue-500' : 'bg-green-500'
                                                    }`}>
                                                    {staff.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {staff.name} {staff.surname}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {staff.role} • {staff.email}
                                                    </p>
                                                </div>
                                                {selectedStaff?.id === staff.id && (
                                                    <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${result.failed === 0
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            }`}>
                            <CheckCircle className={`w-6 h-6 ${result.failed === 0 ? 'text-green-500' : 'text-yellow-500'}`} />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    มอบหมายสำเร็จ {result.success} ราย
                                </p>
                                {result.failed > 0 && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        ล้มเหลว {result.failed} ราย (อาจมีอยู่แล้ว)
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        {result ? 'ปิด' : 'ยกเลิก'}
                    </button>
                    {!result && (
                        <button
                            onClick={handleAssign}
                            disabled={isLoading || !selectedStaff}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            มอบหมาย
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
