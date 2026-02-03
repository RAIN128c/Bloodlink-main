import { supabase } from '@/lib/supabase';
import { AuthService } from './authService';
import { PatientService } from './patientService';
import { VALID_ROLES } from '@/lib/permissions';

export interface DashboardStats {
    totalStaff: number;
    totalPatients: number;
    testedPatients: number;
    inProcessPatients: number;
    appointmentPatients: number;
    missedPatients: number;
    loginHistory: Array<{ name: string, time: string, letter: string, role: string }>;
    chartData: Array<{ label: string, value: number, color: string }>;
    timeSeriesData: Array<{ year: string, inProcess: number, tested: number, received: number }>;
}

export class StatsService {
    static async getDashboardStats(): Promise<DashboardStats> {
        try {
            const [users, patients] = await Promise.all([
                AuthService.getAllUsers(),
                PatientService.getPatients()
            ]);

            // --- Log History ---
            // Fetch last 5 logs from audit_logs
            let loginHistory: Array<{ name: string, time: string, letter: string, role: string }> = [];
            const { data: logs, error: logError } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('action', 'เข้าสู่ระบบ')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!logError && logs) {
                loginHistory = logs.map(log => {
                    const role = log.role || '';
                    const position = log.position || '';
                    const roleDisplay = position ? `${role}(${position})` : role;

                    // Format time: HH:mm
                    const date = new Date(log.created_at);
                    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                    return {
                        name: log.name || 'User',
                        time: timeStr,
                        role: roleDisplay,
                        letter: (log.name || 'U').charAt(0).toUpperCase()
                    };
                });
            }

            // --- Stats Calculation ---
            // Count all users with valid roles
            const staffUsers = users.filter(u => VALID_ROLES.includes(u.role as typeof VALID_ROLES[number]));
            const totalStaff = staffUsers.length;
            const totalPatients = patients.length;

            let tested = 0;
            let inProcess = 0;
            let appointment = 0;
            let missed = 0;

            patients.forEach(p => {
                const process = p.process?.trim();
                if (process === 'นัดหมาย') {
                    appointment++;
                } else if (process === 'เจาะเลือด' || process === 'รอผล' || process === 'กำลังตรวจสอบ') {
                    inProcess++;
                } else if (process === 'ส่งผลตรวจ' || process === 'เสร็จสิ้น' || process === 'รับยาแล้ว') {
                    tested++;
                } else {
                    missed++;
                }
            });

            const chartData = [
                { label: 'กำลังตรวจเลือด', value: inProcess, color: '#F97316' },
                { label: 'ผู้ป่วยที่ได้รับการตรวจเลือด', value: tested, color: '#2DD4BF' },
                { label: 'ได้รับเลือด', value: appointment, color: '#8B5CF6' }
            ];

            // --- Time Series Data ---
            // Simplified aggregation based on patients timestamps
            let timeSeriesData: Array<{ year: string, inProcess: number, tested: number, received: number }> = [];

            const yearlyData: Record<string, { inProcess: number, tested: number, received: number }> = {};

            patients.forEach(p => {
                const dateStr = p.appointmentDate || p.timestamp || '';
                // Assume ISO string or fallback to current year
                let year = new Date().getFullYear().toString();
                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) year = d.getFullYear().toString();
                }

                if (!yearlyData[year]) {
                    yearlyData[year] = { inProcess: 0, tested: 0, received: 0 };
                }
                const process = p.process?.trim();
                if (process === 'เจาะเลือด' || process === 'รอผล' || process === 'กำลังตรวจสอบ') {
                    yearlyData[year].inProcess++;
                } else if (process === 'นัดหมาย') {
                    yearlyData[year].received++;
                } else if (process === 'ส่งผลตรวจ' || process === 'เสร็จสิ้น') {
                    yearlyData[year].tested++;
                }
            });

            timeSeriesData = Object.entries(yearlyData)
                .map(([year, data]) => ({ year, ...data }))
                .sort((a, b) => parseInt(a.year) - parseInt(b.year))
                .slice(-5);


            return {
                totalStaff,
                totalPatients,
                testedPatients: tested,
                inProcessPatients: inProcess,
                appointmentPatients: appointment,
                missedPatients: missed,
                loginHistory,
                chartData,
                timeSeriesData
            };
        } catch (error) {
            console.error('Stats aggregation error:', error);
            return {
                totalStaff: 0,
                totalPatients: 0,
                testedPatients: 0,
                inProcessPatients: 0,
                appointmentPatients: 0,
                missedPatients: 0,
                loginHistory: [],
                chartData: [],
                timeSeriesData: []
            };
        }
    }

    // Get chart data aggregated by scope
    static async getChartDataByScope(scope: 'hour' | 'day' | 'week' | 'month' | 'year'): Promise<Array<{ label: string, inProcess: number, tested: number, received: number }>> {
        try {
            const patients = await PatientService.getPatients();

            // Get time bucket key based on scope
            const getTimeKey = (date: Date, scope: string): string => {
                switch (scope) {
                    case 'hour':
                        return `${date.getHours().toString().padStart(2, '0')}:00`;
                    case 'day':
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                    case 'week':
                        const startOfYear = new Date(date.getFullYear(), 0, 1);
                        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
                        return `W${weekNum}`;
                    case 'month':
                        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                        return monthNames[date.getMonth()];
                    case 'year':
                        return date.getFullYear().toString();
                    default:
                        return date.toISOString();
                }
            };

            // Generate time labels based on scope
            const generateLabels = (scope: string): string[] => {
                const now = new Date();
                switch (scope) {
                    case 'hour':
                        return Array.from({ length: 12 }, (_, i) => {
                            const h = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000);
                            return `${h.getHours().toString().padStart(2, '0')}:00`;
                        });
                    case 'day':
                        return Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        });
                    case 'week':
                        return Array.from({ length: 8 }, (_, i) => {
                            const d = new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000);
                            const startOfYear = new Date(d.getFullYear(), 0, 1);
                            const weekNum = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
                            return `W${weekNum}`;
                        });
                    case 'month':
                        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                        return Array.from({ length: 12 }, (_, i) => {
                            const m = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
                            return monthNames[m.getMonth()];
                        });
                    case 'year':
                        return Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 4 + i).toString());
                    default:
                        return [];
                }
            };

            const labels = generateLabels(scope);
            const dataMap: Record<string, { inProcess: number, tested: number, received: number }> = {};
            labels.forEach(label => {
                dataMap[label] = { inProcess: 0, tested: 0, received: 0 };
            });

            // Aggregate patient statuses
            patients.forEach(p => {
                const dateStr = p.timestamp || p.appointmentDate || '';
                // Note: Patient timestamps should be ISO strings from Supabase now
                const date = new Date(dateStr);

                if (!isNaN(date.getTime())) {
                    const key = getTimeKey(date, scope);
                    // Note: key might not exist in labels depending on range, but we only chart generated labels
                    if (dataMap[key]) {
                        const process = p.process?.trim();
                        if (process === 'เจาะเลือด' || process === 'รอผล' || process === 'กำลังตรวจสอบ') {
                            dataMap[key].inProcess++;
                        } else if (process === 'นัดหมาย' || process === 'กำลังจัดส่ง') {
                            dataMap[key].received++;
                        } else if (process === 'ส่งผลตรวจ' || process === 'เสร็จสิ้น') {
                            dataMap[key].tested++;
                        }
                    }
                }
            });

            return labels.map(label => ({
                label,
                ...dataMap[label]
            }));

        } catch (error) {
            console.error('Chart scope aggregation error:', error);
            return [];
        }
    }
}
