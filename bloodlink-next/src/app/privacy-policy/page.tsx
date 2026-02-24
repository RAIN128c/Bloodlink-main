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
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. ข้อมูลที่เราเก็บรวบรวม (หลักการเก็บรวมรวบข้อมูลเท่าที่จำเป็น - Data Minimization)</h2>
                            <p>
                                ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) เรามุ่งมั่นที่จะเก็บข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการให้บริการเท่านั้น ได้แก่:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>ชื่อและนามสกุล</li>
                                <li>ที่อยู่อีเมล</li>
                                <li>ตำแหน่งงาน (แพทย์, พยาบาล, เจ้าหน้าที่ห้องปฏิบัติการ)</li>
                                <li>ข้อมูลโรงพยาบาล (ชื่อและประเภท)</li>
                                <li>หมายเลขใบประกอบวิชาชีพ หรือ รหัสพนักงาน (เพื่อการยืนยันตัวตนสำหรับลงนามอิเล็กทรอนิกส์)</li>
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
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. การลงลายมือชื่ออิเล็กทรอนิกส์ (E-Signature)</h2>
                            <p>
                                ระบบ BloodLink รองรับการลงนามอิเล็กทรอนิกส์ในแบบฟอร์มหรือเอกสารผ่านการใช้รหัส PIN 6 หลัก โดยระบบได้รับการออกแบบตาม <strong>พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 (และที่แก้ไขเพิ่มเติม)</strong>:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 pb-2">
                                <li><strong>มาตรา 9 (ความสมบูรณ์ของลายมือชื่อ):</strong> ลายมือชื่ออิเล็กทรอนิกส์ที่เกิดจากการใช้รหัส PIN ส่วนบุคคล ซึ่งเชื่อมโยงกับบัญชีผู้ใช้ที่ได้รับการยืนยันตัวตน มีผลทางกฎหมายเช่นเดียวกับการลงลายมือชื่อบนเอกสารกระดาษ สามารถใช้ระบุตัวเจ้าของและแสดงเจตนาต่อข้อความได้</li>
                                <li><strong>มาตรา 26 (ความน่าเชื่อถือของระบบ):</strong> ระบบให้บริการมีกระบวนการดูแลรักษาความปลอดภัยที่เชื่อถือได้ (Reliable System) รวมถึงบันทึกข้อมูลการตรวจสอบย้อนกลับ (Audit Trail) เช่น การบันทึกเวลาที่ลงนาม (Timestamp) หมายเลข IP Address และรหัสดิจิทัล (QR Token) เพื่อใช้ตรวจสอบและยืนยันความถูกต้องของลายมือชื่ออิเล็กทรอนิกส์ได้อย่างรัดกุม</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. ความโปร่งใสของข้อมูล (Transparency Notice)</h2>
                            <p className="mb-3">
                                เพื่อให้เป็นไปตามหลักความโปร่งใสภายใต้ PDPA เราขอแจ้งรายละเอียดเกี่ยวกับการเก็บข้อมูลในระบบลงนามอิเล็กทรอนิกส์ ดังนี้:
                            </p>

                            <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">📋 เราเก็บอะไร</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">
                                        ชื่อ-นามสกุล, เลขใบประกอบวิชาชีพ / รหัสพนักงาน, เวลาที่กดลงนาม (Timestamp), หมายเลข IP Address, และรหัสดิจิทัล (QR Token)
                                    </p>
                                </div>

                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">🎯 เก็บไปทำไม</h3>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                        เพื่อยืนยันความถูกต้องและความน่าเชื่อถือของเอกสารอิเล็กทรอนิกส์ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 รวมถึงเพื่อใช้ในการตรวจสอบย้อนกลับ (Audit Trail) และป้องกันการปลอมแปลงเอกสาร
                                    </p>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                    <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-1">👁️ ใครเห็นได้บ้าง</h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-400">
                                        เฉพาะผู้ที่สแกน QR Code บนเอกสารเพื่อตรวจสอบความถูกต้อง โดยจะเห็นข้อมูลเพียงบางส่วนเท่านั้น (ชื่อผู้ลงนาม, บทบาท, และวันเวลา) ข้อมูลละเอียดอื่นๆ เช่น IP Address จะถูกเก็บไว้ภายในระบบเพื่อการตรวจสอบทางเทคนิคเท่านั้น
                                    </p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
                                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">⏳ เก็บนานแค่ไหน</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        ข้อมูลลายมือชื่ออิเล็กทรอนิกส์จะถูกเก็บรักษาตามอายุความของเอกสารทางการแพทย์ (5–10 ปี ตามประเภทเอกสาร) หรือตามที่กฎหมายกำหนด หลังจากนั้นข้อมูลจะถูกลบออกจากระบบโดยอัตโนมัติ
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. การเปลี่ยนแปลงนโยบาย</h2>
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
