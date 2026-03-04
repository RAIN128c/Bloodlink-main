import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Prompt } from "next/font/google";
import { GlobalProvider } from "@/components/providers/GlobalProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: 'BloodLink - ระบบจัดการข้อมูลผู้ป่วยและผลตรวจเลือด',
    template: '%s | BloodLink',
  },
  description: 'ระบบบริหารจัดการข้อมูลผู้ป่วยและผลตรวจทางห้องปฏิบัติการ สำหรับโรงพยาบาลชุมชนและ รพ.สต.',
  keywords: ['BloodLink', 'ระบบจัดการผู้ป่วย', 'ผลตรวจเลือด', 'โรงพยาบาลชุมชน', 'E-Signature', 'Lab Results', 'Healthcare'],
  robots: { index: false, follow: false },
  openGraph: {
    title: 'BloodLink',
    description: 'ระบบบริหารจัดการข้อมูลผู้ป่วยและผลตรวจทางห้องปฏิบัติการ',
    type: 'website',
    locale: 'th_TH',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${prompt.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalProvider>
            {children}
          </GlobalProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
