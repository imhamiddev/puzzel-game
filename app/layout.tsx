import type { Metadata, Viewport } from "next";
import "vazirmatn/Vazirmatn-font-face.css";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "مسابقه پازل — دوستانت را به چالش بکش. سریع‌تر حل کن. ببر.",
  description:
    "یک پازل اختصاصی از عکس دلخواهت بساز، دوستانت را دعوت کن و برای حل آن مسابقه بده. مسابقه پازل چندنفره به‌صورت زنده.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "مسابقه پازل",
    description: "دوستانت را به چالش بکش. سریع‌تر حل کن. ببر.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-background font-sans antialiased min-h-screen">
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
