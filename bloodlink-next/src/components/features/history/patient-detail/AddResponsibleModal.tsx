import React, { useState, useEffect, useRef } from 'react'
import { UserPlus, X, Search, Loader2, User, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { ResponsiblePerson } from '@/components/features/history/patient-detail/PatientDemographicsCard'

interface StaffMember {
    email: string
    name: string
    surname?: string
    role: string
    userId?: string
    avatarUrl?: string
}

interface AddResponsibleModalProps {
    isOpen: boolean
    onClose: () => void
    hn: string
    responsiblePersons: ResponsiblePerson[]
    onSuccess: () => void
}

// Inner component that mounts fresh each time via key prop
const AddResponsibleModalContent: React.FC<Omit<AddResponsibleModalProps, 'isOpen'>> = ({
    onClose,
    hn,
    responsiblePersons,
    onSuccess
}) => {
    const [staffList, setStaffList] = useState<{ doctors: StaffMember[], nurses: StaffMember[] }>({ doctors: [], nurses: [] })
    const [isLoadingStaff, setIsLoadingStaff] = useState(true)
    const [modalActiveTab, setModalActiveTab] = useState<string>('doctor')
    const [selectedStaffEmail, setSelectedStaffEmail] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [manualEmail, setManualEmail] = useState('')

    useEffect(() => {
        let cancelled = false

        fetch('/api/users/staff')
            .then(res => res.json())
            .then(data => {
                if (cancelled) return
                if (data.staff) {
                    const doctors = data.staff.filter((u: StaffMember) => {
                        const r = (u.role || '').toLowerCase().trim()
                        return r.includes('แพทย์') || r.includes('doctor') || r.includes('med') || r === 'admin'
                    })
                    const nurses = data.staff.filter((u: StaffMember) => {
                        const r = (u.role || '').toLowerCase().trim()
                        return r.includes('พยาบาล') || r.includes('nurse')
                    })
                    setStaffList({ doctors, nurses })
                }
            })
            .catch(err => {
                if (!cancelled) console.error('Failed to fetch staff:', err)
            })
            .finally(() => {
                if (!cancelled) setIsLoadingStaff(false)
            })

        return () => { cancelled = true }
    }, [])

    const handleAddResponsible = async (selectedEmail: string) => {
        if (!selectedEmail) return

        try {
            const response = await fetch(`/api/patients/${hn}/responsibility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', targetEmail: selectedEmail.trim() })
            })

            if (response.ok) {
                toast.success('เพิ่มผู้รับผิดชอบเรียบร้อย')
                onSuccess()
                onClose()
            } else {
                toast.error('ไม่สามารถเพิ่มผู้รับผิดชอบได้')
            }
        } catch (error) {
            console.error('Add responsible error:', error)
            toast.error('เกิดข้อผิดพลาดในการเพิ่มผู้รับผิดชอบ')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1F2937] rounded-xl w-[calc(100%-2rem)] max-w-[500px] mx-4 shadow-2xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 overflow-hidden border border-transparent dark:border-gray-700 flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-white dark:bg-[#1F2937] px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-[#6366F1]" />
                        เพิ่มผู้รับผิดชอบ
                    </h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <button
                        onClick={() => setModalActiveTab('doctor')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'doctor'
                            ? 'text-[#6366F1] dark:text-[#818cf8]'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        แพทย์ ({staffList.doctors.length})
                        {modalActiveTab === 'doctor' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                        )}
                    </button>
                    <button
                        onClick={() => setModalActiveTab('nurse')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'nurse'
                            ? 'text-[#6366F1] dark:text-[#818cf8]'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        พยาบาล ({staffList.nurses.length})
                        {modalActiveTab === 'nurse' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                        )}
                    </button>
                    <button
                        onClick={() => setModalActiveTab('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${modalActiveTab === 'manual'
                            ? 'text-[#6366F1] dark:text-[#818cf8]'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        เพิ่มเติม
                        {modalActiveTab === 'manual' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6366F1] dark:bg-[#818cf8]" />
                        )}
                    </button>
                </div>

                {/* Search Bar - Hide if manual tab */}
                {modalActiveTab !== 'manual' && (
                    <div className="px-4 pt-4 pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ หรืออีเมล..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* List Content */}
                <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
                    {modalActiveTab === 'manual' ? (
                        <div className="flex flex-col h-full">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    กรุณากรอกอีเมลของผู้ใช้งานที่ต้องการเพิ่มเป็นผู้รับผิดชอบ (ต้องเป็นผู้ใช้งานในระบบแล้ว)
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        อีเมลผู้รับผิดชอบ
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={manualEmail}
                                            onChange={(e) => setManualEmail(e.target.value)}
                                            placeholder="example@bloodlink.com"
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isLoadingStaff ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(modalActiveTab === 'doctor' ? staffList.doctors : staffList.nurses)
                                .filter(user =>
                                    !searchQuery ||
                                    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (user.surname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((user) => {
                                    const isAlreadyResponsible = responsiblePersons.some(p => p.email === user.email)
                                    const isSelected = selectedStaffEmail === user.email

                                    return (
                                        <div
                                            key={user.userId || user.email}
                                            onClick={() => !isAlreadyResponsible && setSelectedStaffEmail(user.email)}
                                            className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${isAlreadyResponsible
                                                ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-[#6366F1] dark:border-[#6366F1]'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isAlreadyResponsible ? 'bg-gray-200 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/30 text-[#6366F1] dark:text-indigo-400'
                                                }`}>
                                                {user.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                    {user.name} {user.surname}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            {isAlreadyResponsible ? (
                                                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">มีอยู่แล้ว</span>
                                            ) : isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-[#6366F1]" />
                                            )}
                                        </div>
                                    )
                                })}

                            {(modalActiveTab === 'doctor' ? staffList.doctors : staffList.nurses).length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                    ไม่พบข้อมูล{modalActiveTab === 'doctor' ? 'แพทย์' : 'พยาบาล'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-between items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedStaffEmail ? 'เลือกแล้ว 1 คน' : 'ยังไม่ได้เลือกผู้รับผิดชอบ'}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={() => handleAddResponsible(modalActiveTab === 'manual' ? manualEmail : (selectedStaffEmail || ''))}
                            disabled={(modalActiveTab === 'manual' ? !manualEmail : !selectedStaffEmail) || isLoadingStaff}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] rounded-lg hover:bg-[#4F46E5] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            ยืนยันการเพิ่ม
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Wrapper: conditionally renders and uses key to force remount (fresh state) on each open
export const AddResponsibleModal: React.FC<AddResponsibleModalProps> = (props) => {
    if (!props.isOpen) return null
    return <AddResponsibleModalContent {...props} />
}

