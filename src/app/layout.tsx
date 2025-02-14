"use client";

import "./globals.css";
import { LoginUserProvider } from "./context/login";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div
            className="grid h-screen"
            style={{
              gridTemplateColumns: isSidebarOpen ? "14rem 1fr" : "4rem 1fr",
              transition: "grid-template-columns 0.3s ease-in-out",
            }}
          >
            {/* ✅ 사이드바 컴포넌트 사용 */}
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
            />

            {/* 메인 컨텐츠 */}
            <main className="overflow-auto min-w-0 p-4">{children}</main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}

/** 📌 메뉴 리스트 */
