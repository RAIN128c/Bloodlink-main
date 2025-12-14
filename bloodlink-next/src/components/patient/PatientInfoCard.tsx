import { Patient } from "@/types";
import { User, Activity, HeartPulse, AlertCircle, Droplet, Clock } from "lucide-react";
import { formatDateThai } from "@/lib/utils";

export function PatientInfoCard({ patient }: { patient: Patient }) {
    return (
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden font-[family-name:var(--font-kanit)] transition-colors">
            <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-sm">
                        <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name} {patient.surname}</h2>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">HN: {patient.hn}</span>
                            <span className="mx-2">•</span>
                            <span>Registered: {formatDateThai(patient.timestamp)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoItem label="Gender" value={patient.gender} icon={User} />
                    <InfoItem label="Age" value={`${patient.age} Years`} icon={Clock} />
                    <InfoItem label="Blood Type" value={patient.bloodType} icon={Droplet} highlight />
                    <InfoItem label="Status" value={patient.status} icon={Activity}
                        color={patient.status === 'ใช้งาน' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                    />
                </div>

                <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <HeartPulse className="h-5 w-5 mr-2 text-rose-500 dark:text-rose-400" />
                        Medical Information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Diseases</span>
                            <div className="flex flex-wrap gap-2">
                                {patient.disease && patient.disease !== '-' ? (
                                    patient.disease.split(',').map((d, i) => (
                                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                                            {d.trim()}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 dark:text-gray-500 text-sm">No underlying diseases</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Allergies</span>
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-lg w-full">
                                    {patient.allergies || 'No allergies recorded'}
                                </span>
                            </div>
                        </div>

                        {patient.medication && patient.medication !== '-' && (
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">Current Medication</span>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">{patient.medication}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value: string;
    icon: React.ElementType;
    highlight?: boolean;
    color?: string;
}

function InfoItem({ label, value, icon: Icon, highlight = false, color = "text-gray-900 dark:text-white" }: InfoItemProps) {
    return (
        <div className="flex items-start p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} mr-4`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={`font-semibold ${color} ${highlight ? 'text-lg' : 'text-base'}`}>{value || '-'}</p>
            </div>
        </div>
    );
}
