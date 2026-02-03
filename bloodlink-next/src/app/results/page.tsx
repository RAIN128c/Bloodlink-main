'use client';

import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Activity, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { formatDateTimeThai } from '@/lib/utils';
import { toast } from 'sonner';

export default function ResultsPage() {
    const [currentDate, setCurrentDate] = useState('');
    const [checkDay, setCheckDay] = useState('');
    const [checkMonth, setCheckMonth] = useState('');
    const [checkYear, setCheckYear] = useState('');

    // Check Result Logic State
    const [resultState, setResultState] = useState<'hidden' | 'future' | 'today' | 'past'>('hidden');
    const [diffDays, setDiffDays] = useState(0);

    // Data State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Set current date string
        setCurrentDate(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }));

        async function fetchResults() {
            try {
                const response = await fetch('/api/patients');
                if (response.ok) {
                    const allPatients: Patient[] = await response.json();

                    // Filter for patients with completed process or having results
                    // Adjust this filter based on your business logic for "Results"
                    // Assuming 'เสร็จสิ้น' process means results are ready
                    // Or filtering by those who have testType set and process is not 'นัดหมาย'
                    const resultPatients = allPatients.filter(p =>
                        p.process === 'เสร็จสิ้น' || p.process === 'รายงานผล'
                    );
                    setPatients(resultPatients);
                }
            } catch (error) {
                console.error('Failed to fetch patients:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchResults();
    }, []);

    const handleCheck = () => {
        if (!checkDay || !checkMonth || !checkYear) {
            toast.warning('กรุณากรอกวันที่ให้ครบถ้วน');
            return;
        }

        const yearNum = parseInt(checkYear);
        // Modernized Logic: Support both 2-digit (e.g. 68 -> 2568) and 4-digit BE (e.g. 2568)
        const fullBeYear = yearNum < 100 ? 2500 + yearNum : yearNum;
        const adYear = fullBeYear - 543;

        const inputDate = new Date(adYear, parseInt(checkMonth) - 1, parseInt(checkDay));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - inputDate.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setDiffDays(days);

        if (days < 0) setResultState('future');
        else if (days === 0) setResultState('today');
        else setResultState('past');
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void, nextId?: string) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setter(val);
        if (val.length >= e.target.maxLength && nextId) {
            document.getElementById(nextId)?.focus();
        }
    };

    return (

        <MainLayout>
            <div className="max-w-[960px] w-full mx-auto flex flex-col h-full">
                <Header />

                <div className="flex flex-col-reverse lg:flex-row gap-4 h-auto lg:h-[calc(100vh-96px)] pb-4">
                    {/* Left Column: Results List */}
                    <div className="flex-1 bg-[#F3F4F6] dark:bg-transparent rounded-[20px] flex flex-col overflow-hidden transition-colors min-h-[500px]">
                        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 animate-fade-in-up">
                            <h1 className="text-[22px] font-bold text-[#111827] dark:text-white">ผลตรวจเลือด</h1>
                            <Link href="/test-status" className="flex items-center gap-1.5 text-[#6366F1] dark:text-indigo-400 font-semibold hover:text-[#4F46E5] dark:hover:text-indigo-300 transition-colors text-[13px]">
                                <Activity className="w-4 h-4" />
                                สถานะผลตรวจเลือด
                            </Link>
                        </div>

                        <div className="mb-3 animate-fade-in-up stagger-1">
                            <h2 className="text-[16px] font-semibold text-[#8B5CF6] dark:text-violet-400 mb-1.5">{currentDate}</h2>
                            <div className="h-[3px] w-full bg-[#E0E7FF] dark:bg-gray-700 rounded-full mb-3"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : patients.length > 0 ? (
                                patients.map((patient, idx) => (
                                    <div key={`${patient.hn}-${idx}`} className="bg-white dark:bg-[#1F2937] rounded-[12px] p-4 flex flex-col gap-2 shadow-sm border border-transparent hover:border-[#E0E7FF] dark:hover:border-gray-600 transition-all cursor-pointer group card-animate hover-lift" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div>
                                            <div className="text-[16px] font-bold text-[#1F2937] dark:text-white mb-0.5">
                                                HN : {patient.hn}
                                            </div>
                                            <div className="text-[11px] text-[#4B5563] dark:text-gray-400">
                                                {patient.name} {patient.surname} {patient.timestamp && `; ${formatDateTimeThai(patient.timestamp)}`}
                                            </div>
                                        </div>
                                        <Link
                                            href={`/results/${patient.hn}`}
                                            className="w-14 h-7 flex items-center justify-center bg-[#E0E7FF] dark:bg-indigo-900/50 text-[#374151] dark:text-indigo-200 text-[11px] font-medium rounded-[6px] hover:bg-[#C7D2FE] dark:hover:bg-indigo-800 transition-colors"
                                        >
                                            ดูผล
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>ไม่พบรายการผลตรวจเลือด</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Filter Widget */}
                    <div className="w-full lg:w-[240px] flex flex-col gap-3 flex-shrink-0 animate-fade-in-right">
                        <div className="bg-[#E9EFFD] dark:bg-[#1F2937] rounded-[20px] p-4 flex flex-col items-center text-center h-auto lg:h-full lg:max-h-[400px] transition-colors shadow-sm lg:shadow-none">
                            <div className="bg-white dark:bg-[#374151] rounded-[16px] p-4 w-full shadow-sm flex flex-col items-center transition-colors">
                                <h3 className="text-[14px] font-bold text-[#1F2937] dark:text-white mb-1.5 leading-tight">เช็ควันและประเภท<br />ในการตรวจที่ผ่านมา</h3>

                                <div className="w-full mb-2">
                                    <div className="text-[10px] text-[#6B7280] dark:text-gray-300 mb-1 text-left w-full pl-1">วันที่</div>
                                    <div className="flex items-center justify-center gap-1 mb-1.5">
                                        <input
                                            id="inputDay"
                                            type="text"
                                            placeholder="dd"
                                            maxLength={2}
                                            value={checkDay}
                                            onChange={(e) => handleDateInput(e, setCheckDay, 'inputMonth')}
                                            className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300"
                                        />
                                        <span className="text-[#1F2937] dark:text-gray-300 font-semibold text-[12px]">/</span>
                                        <input
                                            id="inputMonth"
                                            type="text"
                                            placeholder="mm"
                                            maxLength={2}
                                            value={checkMonth}
                                            onChange={(e) => handleDateInput(e, setCheckMonth, 'inputYear')}
                                            className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300"
                                        />
                                        <span className="text-[#1F2937] dark:text-gray-300 font-semibold text-[12px]">/</span>
                                        <input
                                            id="inputYear"
                                            type="text"
                                            placeholder="yy"
                                            maxLength={4}
                                            value={checkYear}
                                            onChange={(e) => handleDateInput(e, setCheckYear)}
                                            className="w-[43px] h-[29px] rounded-[5px] border border-[#93C5FD] dark:border-gray-500 bg-white dark:bg-[#4B5563] text-center text-[11px] text-[#374151] dark:text-white outline-none focus:border-[#3B82F6] transition-all placeholder-gray-400 dark:placeholder-gray-300"
                                        />
                                    </div>
                                    <p className="text-[9px] text-[#9CA3AF] dark:text-gray-400 text-center">กรุณากรอกวันที่เพื่อตรวจสอบ</p>
                                </div>

                                {/* Result Summary Box */}
                                <div className={`w-full rounded-[10px] p-3 min-h-[96px] flex flex-col items-center justify-center transition-all duration-300 mb-3 bg-[#E1EAFA] dark:bg-[#4B5563]`}>
                                    {resultState === 'hidden' ? (
                                        <p className="text-[10px] text-[#6B7280] dark:text-gray-300">กรอกวันที่และกดเช็คเพื่อดูผล</p>
                                    ) : (
                                        <div className="flex flex-col items-center text-[#374151] dark:text-gray-200 text-center">
                                            <div className="text-[11px] mb-0.5">
                                                {resultState === 'future' ? 'วันที่ในอนาคต' :
                                                    resultState === 'today' ? 'วันนี้' :
                                                        <>ได้ผ่านการตรวจมาแล้ว <span className="font-bold">{diffDays}</span> วัน</>
                                                }
                                            </div>
                                            <div className="text-[11px] font-semibold text-[#1F2937] dark:text-white">ประเภทการตรวจ : CBC</div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleCheck}
                                    className="w-[80px] py-1.5 bg-[#5FABE7] hover:bg-[#4B9CD8] text-white font-medium rounded-[6px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-colors text-[11px]"
                                >
                                    เช็ค
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
