'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Patient } from '@/types';
import { Search, UserPlus, ChevronRight, FileText } from 'lucide-react';

export function PatientList({ initialPatients }: { initialPatients: Patient[] }) {
    const [patients, setPatients] = useState<Patient[]>(initialPatients);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All'); // 'All' | 'Active' | 'Pending'

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-patients')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                    console.log('Real-time patient update:', payload);
                    if (payload.eventType === 'INSERT') {
                        setPatients((prev) => [payload.new as Patient, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setPatients((prev) =>
                            prev.map((p) => (p.hn === (payload.new as Patient).hn ? (payload.new as Patient) : p))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setPatients((prev) =>
                            prev.filter((p) => p.hn !== (payload.old as Patient).hn)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Update local state if initialPatients changes (e.g. parent re-fetch)
    useEffect(() => {
        setPatients(initialPatients);
    }, [initialPatients]);

    const filteredPatients = patients.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.surname.toLowerCase().includes(search.toLowerCase()) ||
            p.hn.includes(search);

        // Status matching logic
        if (filter === 'All') return true;
        if (filter === 'ใช้งาน') return p.status === 'ใช้งาน';
        if (filter === 'In Process') {
            return ['เจาะเลือด', 'กำลังจัดส่ง', 'กำลังตรวจ'].includes(p.process);
        }
        return p.status === filter;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-[family-name:var(--font-kanit)]">
            {/* Header / Controls */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['All', 'ใช้งาน', 'In Process'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setFilter(opt)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filter === opt
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {opt === 'ใช้งาน' ? 'Active' : opt}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search HN or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-48"
                        />
                    </div>

                    <Link
                        href="/patients/add"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Patient
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Info</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">HN</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Process</th>
                            <th className="px-6 py-4 text-end text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr key={patient.hn} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm border border-blue-100">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{patient.name} {patient.surname}</div>
                                                <div className="text-xs text-gray-500">{patient.age} Years • {patient.gender}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{patient.hn}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${patient.status === 'ใช้งาน' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${patient.process === 'เสร็จสิ้น' ? 'bg-green-500' :
                                                patient.process === 'นัดหมาย' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}></div>
                                            <span className="text-sm text-gray-700">{patient.process || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/history/${patient.hn}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center group-hover:underline">
                                            View Details <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <p className="font-medium">No patients found matching "{search}"</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination Placeholder */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Showing {filteredPatients.length} entries</span>
            </div>
        </div>
    );
}
