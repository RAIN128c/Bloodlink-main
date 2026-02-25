import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates a PDF snapshot from a React node reference.
 * @param element React element ref (div container)
 * @param filename Desired filename for the output
 * @param orientation 'portrait' | 'landscape'
 * @returns Blob of the generated PDF
 */
export async function generatePDFFromElement(
    element: HTMLElement,
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<Blob> {
    const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true, // Allow cross-origin images like avatars/logos
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add image to PDF, offset 0,0
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Return as Blob for Supabase Storage
    return pdf.output('blob');
}
