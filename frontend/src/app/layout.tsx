import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import Providers from "@/components/Providers";
import AuthInitializer from "@/components/AuthInitializer";

export const metadata: Metadata = {
  title: "Next.js Demo | Premium Dashboard",
  description: "Next.js 기반의 현대적인 대시보드 시스템 데모",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <AuthInitializer>
            <DashboardLayout>
              {children}
            </DashboardLayout>
          </AuthInitializer>
        </Providers>
      </body>
    </html>
  );
}
