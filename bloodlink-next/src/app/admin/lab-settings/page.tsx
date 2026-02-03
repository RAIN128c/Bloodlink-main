'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Save, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { RoleGuard } from '@/components/providers/RoleGuard';
import { ImportRangesModal } from '@/components/modals/ImportRangesModal';

interface LabRange {
    id: string;
    test_key: string;
    test_name: string;
    min_value: number | null;
    max_value: number | null;
    unit: string | null;
}

export default function LabSettingsPage() {
    const [ranges, setRanges] = useState<LabRange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);

    const fetchRanges = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/settings/lab-ranges');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRanges(data);
        } catch (error) {
            toast.error('โหลดข้อมูลไม่สำเร็จ');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRanges();
    }, []);

    const handleUpdate = async (range: LabRange) => {
        setSavingId(range.id);
        try {
            const res = await fetch('/api/settings/lab-ranges', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: range.id,
                    min_value: range.min_value,
                    max_value: range.max_value,
                    unit: range.unit
                }),
            });

            if (!res.ok) throw new Error('Failed to update');
            toast.success(`อัปเดต ${range.test_name} เรียบร้อย`);
        } catch (error) {
            toast.error('บันทึกไม่สำเร็จ');
        } finally {
            setSavingId(null);
        }
    };

    const handleChange = (id: string, field: keyof LabRange, value: string) => {
        setRanges(prev => prev.map(item => {
            if (item.id !== id) return item;

            let finalValue: any = value;
            if (field === 'min_value' || field === 'max_value') {
                finalValue = value === '' ? null : parseFloat(value);
            }

            return { ...item, [field]: finalValue };
        }));
    };

    const handleImportData = async (importedData: any[]) => {
        let updatedCount = 0;

        const updates = importedData.map(async (importedItem) => {
            const target = ranges.find(r => r.test_key === importedItem.test_key);
            if (target) {
                try {
                    const res = await fetch('/api/settings/lab-ranges', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: target.id,
                            min_value: importedItem.min_value,
                            max_value: importedItem.max_value,
                            unit: importedItem.unit
                        }),
                    });
                    if (res.ok) updatedCount++;
                } catch (e) {
                    console.error(e);
                }
            }
        });

        await Promise.all(updates);

        if (updatedCount > 0) {
            toast.success(`อัปเดตข้อมูลสำเร็จ ${updatedCount} รายการ`);
            fetchRanges();
        } else {
            toast.warning('ไม่พบรายการที่ตรงกันในระบบ');
        }
    };

    return (
        <RoleGuard allowedRoles={['admin', 'medtech', 'doctor']}>
            <div className="flex bg-[#F9FAFB] min-h-screen font-[family-name:var(--font-kanit)]">
                <Sidebar />
                <div className="ml-0 md:ml-[195px] flex-1 flex flex-col min-h-screen w-full transition-all duration-300">
                    <main className="flex-1 p-6">
                        <div className="max-w-5xl mx-auto">
                            <Header />

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าค่าเกณฑ์ปกติ</h1>
                                    <p className="text-gray-500 text-sm md:text-base">กำหนดค่าต่ำสุด-สูงสุด สำหรับการแปลผลตรวจเลือด</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => setIsImportOpen(true)}
                                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium shadow-sm"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        Smart Import
                                    </button>
                                    <button
                                        onClick={fetchRanges}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {isLoading ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Helper to render a group */}
                                        {[
                                            {
                                                title: 'Hematology (CBC)',
                                                keys: ['wbc', 'rbc', 'hb', 'hct', 'mcv', 'mch', 'mchc', 'plt', 'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'plateletSmear', 'nrbc', 'rbcMorphology']
                                            },
                                            {
                                                title: 'Clinical Chemistry',
                                                keys: ['fbs', 'uricAcid', 'ast', 'alt', 'cholesterol', 'triglyceride', 'hdl', 'ldl']
                                            },
                                            {
                                                title: 'Urinalysis',
                                                keys: ['urineAlbumin', 'urineSugar']
                                            }
                                        ].map((group) => {
                                            // 1. Filter items belonging to this group
                                            const groupItems = ranges.filter(r => group.keys.includes(r.test_key));

                                            // 2. Sort them based on the predefined key order
                                            groupItems.sort((a, b) => {
                                                return group.keys.indexOf(a.test_key) - group.keys.indexOf(b.test_key);
                                            });

                                            if (groupItems.length === 0) return null;

                                            return (
                                                <div key={group.title} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">{group.title}</h3>
                                                    </div>

                                                    {/* Mobile View (Cards) */}
                                                    <div className="md:hidden divide-y divide-gray-100">
                                                        {groupItems.map((item) => (
                                                            <div key={item.id} className="p-4 space-y-3 bg-white">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{item.test_name}</div>
                                                                        <div className="text-xs text-gray-400 font-mono">{item.test_key}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleUpdate(item)}
                                                                        disabled={savingId === item.id}
                                                                        className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                                                    >
                                                                        {savingId === item.id ? (
                                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                                        ) : (
                                                                            <Save className="w-5 h-5" />
                                                                        )}
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-3">
                                                                    <div className="col-span-1">
                                                                        <label className="text-xs text-gray-500 mb-1 block">Min</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={item.min_value ?? ''}
                                                                            onChange={(e) => handleChange(item.id, 'min_value', e.target.value)}
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                                                                            placeholder="-"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-1">
                                                                        <label className="text-xs text-gray-500 mb-1 block">Max</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={item.max_value ?? ''}
                                                                            onChange={(e) => handleChange(item.id, 'max_value', e.target.value)}
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                                                                            placeholder="-"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-1">
                                                                        <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                                                                        <input
                                                                            type="text"
                                                                            value={item.unit || ''}
                                                                            onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                                                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                                                                            placeholder="-"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Desktop View (Table) */}
                                                    <div className="hidden md:block overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                                                <tr>
                                                                    <th className="px-6 py-3 w-[250px]">รายการตรวจ (Test Name)</th>
                                                                    <th className="px-6 py-3 w-[150px]">หน่วย (Unit)</th>
                                                                    <th className="px-6 py-3 w-[150px]">ค่าต่ำสุด (Min)</th>
                                                                    <th className="px-6 py-3 w-[150px]">ค่าสูงสุด (Max)</th>
                                                                    <th className="px-6 py-3 w-[100px] text-right">บันทึก</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {groupItems.map((item) => (
                                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-6 py-4 font-medium text-gray-900">
                                                                            <div>{item.test_name}</div>
                                                                            <div className="text-xs text-gray-400 font-normal">{item.test_key}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <input
                                                                                type="text"
                                                                                value={item.unit || ''}
                                                                                onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                                placeholder="-"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.min_value ?? ''}
                                                                                onChange={(e) => handleChange(item.id, 'min_value', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                                placeholder="-"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.max_value ?? ''}
                                                                                onChange={(e) => handleChange(item.id, 'max_value', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                                placeholder="-"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <button
                                                                                onClick={() => handleUpdate(item)}
                                                                                disabled={savingId === item.id}
                                                                                className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                                            >
                                                                                {savingId === item.id ? (
                                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                                ) : (
                                                                                    <Save className="w-5 h-5" />
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Other/Uncategorized - Renders any items NOT covered in the groups above */}
                                        {(() => {
                                            const categorizedKeys = new Set([
                                                ...['wbc', 'rbc', 'hb', 'hct', 'mcv', 'mch', 'mchc', 'plt', 'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'plateletSmear', 'nrbc', 'rbcMorphology'],
                                                ...['fbs', 'uricAcid', 'ast', 'alt', 'cholesterol', 'triglyceride', 'hdl', 'ldl'],
                                                ...['urineAlbumin', 'urineSugar']
                                            ]);

                                            const otherItems = ranges.filter(r => !categorizedKeys.has(r.test_key));

                                            if (otherItems.length === 0) return null;

                                            return (
                                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">รายการอื่นๆ (Others)</h3>
                                                    </div>

                                                    {/* Desktop View (Table) for Others */}
                                                    <div className="hidden md:block overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <tbody className="divide-y divide-gray-100">
                                                                {otherItems.map((item) => (
                                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-6 py-4 font-medium text-gray-900 w-[250px]">
                                                                            <div>{item.test_name}</div>
                                                                            <div className="text-xs text-gray-400 font-normal">{item.test_key}</div>
                                                                        </td>
                                                                        {/* ... inputs same as above ... */}
                                                                        <td className="px-6 py-4 w-[150px]">
                                                                            <input
                                                                                type="text"
                                                                                value={item.unit || ''}
                                                                                onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4 w-[150px]">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.min_value ?? ''}
                                                                                onChange={(e) => handleChange(item.id, 'min_value', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4 w-[150px]">
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.max_value ?? ''}
                                                                                onChange={(e) => handleChange(item.id, 'max_value', e.target.value)}
                                                                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-6 py-4 w-[100px] text-right">
                                                                            <button
                                                                                onClick={() => handleUpdate(item)}
                                                                                disabled={savingId === item.id}
                                                                                className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                                            >
                                                                                {savingId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <ImportRangesModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onConfirm={handleImportData}
            />
        </RoleGuard>
    );
}
