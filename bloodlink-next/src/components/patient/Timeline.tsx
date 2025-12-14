import clsx from 'clsx';
import { Calendar, Syringe, Truck, Activity, CheckCircle } from 'lucide-react';

const STEPS = ['นัดหมาย', 'เจาะเลือด', 'กำลังจัดส่ง', 'กำลังตรวจ', 'เสร็จสิ้น'];
const ICONS = [Calendar, Syringe, Truck, Activity, CheckCircle];

export function Timeline({ currentStatus }: { currentStatus: string }) {
    const currentIndex = STEPS.indexOf(currentStatus);
    // If status not found (e.g. 'รอตรวจ'), default to -1 (none active) or 0? 
    // Legacy 'รอตรวจ' implies before process start? Or 'นัดหมาย' is first.
    // Assuming 'รอตรวจ' is basically index -1 or 0?
    // Let's safe guard.
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="w-full bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 font-[family-name:var(--font-kanit)] transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8">Status Timeline</h3>
            <div className="relative flex justify-between">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700 -translate-y-1/2 z-0 rounded-full" />

                {/* Progress Line */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                    style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((step, index) => {
                    const Icon = ICONS[index];
                    const isCompleted = index <= activeIndex;
                    const isActive = index === activeIndex;

                    return (
                        <div key={step} className="relative z-10 flex flex-col items-center group">
                            <div className={clsx(
                                "h-12 w-12 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                                isCompleted
                                    ? "bg-blue-600 border-blue-100 dark:border-blue-900/50 text-white shadow-md scale-110"
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-500"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className={clsx(
                                "absolute -bottom-8 w-24 text-center text-xs font-medium transition-colors duration-300",
                                isActive ? "text-blue-600 dark:text-blue-400 font-bold" : "text-gray-400 dark:text-gray-500"
                            )}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
