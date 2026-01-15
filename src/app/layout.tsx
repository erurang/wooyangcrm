import "./globals.css";
import ClientWrapper from "../components/ClientWrapper";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "WOOYANG CRM",
  description: "우양신소재 CRM 시스템",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Suspense fallback={<div></div>}>
          <ClientWrapper>{children}</ClientWrapper>
        </Suspense>
      </body>
    </html>
  );
}
