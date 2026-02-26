'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PrintItem {
    hn: string;
    name: string;
    url: string;
    fileType?: string;
}

export default function BatchPrintPage() {
    const params = useParams();
    const hash = params?.hash as string;

    const [items, setItems] = useState<PrintItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!hash) return;

        async function fetchSnapshot() {
            try {
                const res = await fetch(`/api/print-snapshot/${hash}`);
                if (!res.ok) throw new Error('Failed to load snapshot');

                const data = await res.json();
                if (data.snapshot && data.snapshot.payload) {
                    const payloadItems = data.snapshot.payload.items as PrintItem[];
                    setItems(payloadItems || []);
                } else {
                    setError('ไม่พบข้อมูลการพิมพ์');
                }
            } catch (err) {
                console.error(err);
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูลการพิมพ์');
            } finally {
                setLoading(false);
            }
        }

        fetchSnapshot();
    }, [hash]);

    useEffect(() => {
        if (!loading && items.length > 0) {
            const imageItems = items.filter(i => i.fileType?.startsWith('image/'));
            const pdfItems = items.filter(i => !i.fileType?.startsWith('image/'));

            // Open PDFs in new tabs if needed
            if (pdfItems.length > 0) {
                // Warning: This might be blocked by popup blockers if more than 1,
                // but the user approved this flow in their original implementation.
                pdfItems.forEach(item => {
                    setTimeout(() => {
                        window.open(item.url, '_blank');
                    }, 100);
                });
            }

            // Only print this window if there are images
            if (imageItems.length > 0) {
                const timer = setTimeout(() => {
                    window.print();
                    // Optional: window.close() after print, but some browsers block auto-closing 
                    // a window if it wasn't opened by script directly (it was, but still).
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                toast.success('เปิดไฟล์ PDF แล้ว สามารถสั่งพิมพ์ได้จากแท็บใหม่');
            }
        }
    }, [items, loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-600 font-medium tracking-wide">กำลังเตรียมเอกสาร...</p>
            </div>
        );
    }

    if (error || items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-medium">
                {error || 'ไม่มีข้อมูลที่จะพิมพ์'}
            </div>
        );
    }

    const imageItems = items.filter(i => i.fileType?.startsWith('image/'));

    return (
        <div className="print-container">
            <style jsx global>{`
                @page { size: A4 portrait; margin: 5mm; }
                body { background: #f3f4f6; font-family: sans-serif; margin: 0; }
                @media print { html, body { background: #fff; height: 100%; } body * { visibility: hidden; } .print-content, .print-content * { visibility: visible; } .print-content { position: absolute; left: 0; top: 0; width: 100%; } }
                .page { page-break-after: always; padding: 10mm; background: #fff; margin: 20px auto; max-width: 210mm; min-height: 297mm; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; }
                @media print { .page { margin: 0; box-shadow: none; page-break-after: always; } }
                .page:last-child { page-break-after: auto; }
                .header-block { text-align: center; margin-bottom: 16px; font-size: 14px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; width: 100%; flex-shrink: 0; }
                .header-title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            `}</style>

            <div className="print-content">
                {imageItems.map((item, index) => (
                    <div key={`${item.hn}-${index}`} className="page">
                        <div className="header-block">
                            <div className="header-title">ผลตรวจเลือด</div>
                            <div>HN: {item.hn} — {item.name}</div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.url}
                            alt={`Lab result - ${item.hn}`}
                            className="max-w-full max-h-[250mm] object-contain block mx-auto"
                        />
                    </div>
                ))}
            </div>

            {/* Print trigger fallback if automatic fails */}
            <div className="fixed bottom-6 right-6 flex gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
                >
                    พิมพ์อีกครั้ง
                </button>
            </div>
        </div>
    );
}
