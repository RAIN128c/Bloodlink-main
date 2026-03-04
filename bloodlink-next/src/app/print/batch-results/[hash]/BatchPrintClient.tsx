'use client'

import { useEffect } from 'react'
import { PrintButtons } from '../../request-sheet/[hn]/PrintButtons'
import { toast } from 'sonner'

interface PrintItem {
    hn: string
    name: string
    url: string
    fileType?: string
}

interface BatchPrintClientProps {
    items: PrintItem[]
    hash: string
}

export function BatchPrintClient({ items, hash }: BatchPrintClientProps) {
    useEffect(() => {
        if (items.length > 0) {
            const imageItems = items.filter(i => i.fileType?.startsWith('image/'))
            const pdfItems = items.filter(i => !i.fileType?.startsWith('image/'))

            // Open PDFs in new tabs
            if (pdfItems.length > 0) {
                pdfItems.forEach(item => {
                    setTimeout(() => {
                        window.open(item.url, '_blank')
                    }, 100)
                })
            }

            // Auto-print if there are images
            if (imageItems.length > 0) {
                const timer = setTimeout(() => {
                    window.print()
                }, 1000)
                return () => clearTimeout(timer)
            } else {
                toast.success('เปิดไฟล์ PDF แล้ว สามารถสั่งพิมพ์ได้จากแท็บใหม่')
            }
        }
    }, [items])

    const imageItems = items.filter(i => i.fileType?.startsWith('image/'))

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex flex-col items-center">
            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    html, body { background: #fff !important; margin: 0; padding: 0; }
                    .print-page {
                        page-break-after: always;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .print-page:last-child { page-break-after: auto; }
                    .print-page img {
                        max-width: 100% !important;
                        max-height: 285mm !important;
                        object-fit: contain !important;
                    }
                }
            `}</style>

            {/* Toolbar — same pattern as request-sheet/snapshot */}
            <div className="w-full bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-[100] shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <PrintButtons showPrint={false} />
                    <div className="ml-2">
                        <h1 className="font-bold text-gray-900">พิมพ์ผลตรวจเลือด</h1>
                        <p className="text-sm text-gray-500">
                            {imageItems.length === 1
                                ? `HN: ${imageItems[0].hn} - ${imageItems[0].name}`
                                : imageItems.length > 0
                                    ? `กำลังดู ${imageItems.length} รายการ`
                                    : 'ไม่มีภาพที่จะพิมพ์'
                            }
                        </p>
                    </div>
                </div>
                <PrintButtons showPrint={true} showBack={false} />
            </div>

            {/* Print pages — each image gets its own page */}
            <div className="w-full max-w-[210mm] print:max-w-none mx-auto bg-white my-8 print:my-0 shadow-xl print:shadow-none overflow-hidden">
                {imageItems.map((item, index) => (
                    <div
                        key={`print-${item.hn}-${index}`}
                        className="print-page p-6 print:p-0 flex items-center justify-center"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.url}
                            alt={`Lab result - ${item.hn}`}
                            className="max-w-full max-h-[80vh] print:max-h-[285mm] object-contain block mx-auto"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
