"use client";

import "./globals.css";
import { LoginUserProvider } from "@/context/login";
import Sidebar from "@/components/Sidebar";
import { useSearchParams } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const isFullscreen = searchParams.get("fullscreen") === "true"; // 🔥 URL에 fullscreen=true가 있으면 활성화

  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div className="h-screen flex">
            {!isFullscreen && <Sidebar />}{" "}
            {/* 🔥 fullscreen 모드가 아닐 때만 Sidebar 렌더링 */}
            <main className="overflow-auto w-full p-4">{children}</main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}
