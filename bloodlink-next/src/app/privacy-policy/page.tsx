import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] py-12 px-4 sm:px-6 lg:px-8 font-[family-name:var(--font-kanit)]">
            <div className="max-w-3xl mx-auto bg-white dark:bg-[#1F2937] shadow-lg rounded-2xl overflow-hidden">
                <div className="p-8">
                    <div className="mb-6">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">นโยบายความเป็นส่วนตัว</h1>

                    <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
                        <p>
                            BloodLink ("เรา") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีที่เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของคุณเมื่อคุณใช้งานแอปพลิเคชันของเรา
                        </p>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. ข้อมูลที่เราเก็บรวบรวม</h2>
                            <p>
                                เราอาจเก็บรวบรวมข้อมูลต่อไปนี้เมื่อคุณลงทะเบียนหรือใช้งานแอปพลิเคชัน:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>ชื่อและนามสกุล</li>
                                <li>ที่อยู่อีเมล</li>
                                <li>ตำแหน่งงาน (แพทย์, พยาบาล, เจ้าหน้าที่ห้องปฏิบัติการ)</li>
                                <li>ข้อมูลโรงพยาบาล (ชื่อและประเภท)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. วิธีการใช้ข้อมูล</h2>
                            <p>
                                เราใช้ข้อมูลของคุณเพื่อ:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>ยืนยันตัวตนและจัดการบัญชีผู้ใช้ของคุณ</li>
                                <li>ให้บริการระบบส่งต่อผู้ป่วยและตรวจสอบประวัติการรักษา</li>
                                <li>ติดต่อสื่อสารเกี่ยวกับบริการหรือการเปลี่ยนแปลงนโยบาย</li>
                                <li>ปรับปรุงและพัฒนาประสิทธิภาพของแอปพลิเคชัน</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. การรักษาความปลอดภัยของข้อมูล</h2>
                            <p>
                                เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการเข้าถึง การใช้ หรือการเปลี่ยนแปลงข้อมูลของคุณโดยไม่ได้รับอนุญาต อย่างไรก็ตาม โปรดทราบว่าไม่มีวิธีการส่งข้อมูลผ่านอินเทอร์เน็ตหรือวิธีการจัดเก็บอิเล็กทรอนิกส์ใดที่มีความปลอดภัย 100%
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. การเปิดเผยข้อมูลต่อบุคคลภายนอก</h2>
                            <p>
                                เราจะไม่ขาย แลกเปลี่ยน หรือโอนข้อมูลส่วนบุคคลของคุณไปยังบุคคลภายนอก ยกเว้นในกรณีที่จำเป็นเพื่อการให้บริการ (เช่น ผู้ให้บริการระบบคลาวด์) หรือตามที่กฎหมายกำหนด
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. สิทธิ์ของคุณ</h2>
                            <p>
                                คุณมีสิทธิ์ในการเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณ คุณสามารถติดต่อเราหากต้องการดำเนินการดังกล่าว
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. การเปลี่ยนแปลงนโยบาย</h2>
                            <p>
                                เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว เราแนะนำให้คุณตรวจสอบหน้านี้เป็นระยะเพื่อให้ทราบถึงการเปลี่ยนแปลงใดๆ
                            </p>
                        </section>

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                หากคุณมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ โปรดติดต่อผู้ดูแลระบบ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
