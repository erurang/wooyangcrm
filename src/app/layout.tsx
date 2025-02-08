"use client";

import "./globals.css";
import Link from "next/link";
import { LoginUserProvider } from "./context/login";
import { useState, useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="ko">
      <body className="h-screen">
        <LoginUserProvider>
          {/* 🔹 grid 적용: 사이드바와 메인 영역 비율 자동 조정 */}
          <div
            className="grid h-screen"
            style={{
              gridTemplateColumns: isSidebarOpen ? "14rem 1fr" : "4rem 1fr",
              transition: "grid-template-columns 0.3s ease-in-out",
            }}
          >
            {/* 사이드바 */}
            <div
              className={`bg-[#F8F8F7] min-h-screen border-r-2 px-2 pt-2 text-sm text-[#5F5E5B] transition-all duration-300`}
            >
              <div
                className="py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm flex items-center justify-between"
                onClick={toggleSidebar}
              >
                {isSidebarOpen ? (
                  <>
                    <span>사이드바 닫기</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.707 14.707a1 1 0 01-1.414 0L4.586 11l3.707-3.707a1 1 0 011.414 1.414L7.414 11l2.293 2.293a1 1 0 010 1.414z" />
                    </svg>
                  </>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414L10.707 12l3.293 3.293a1 1 0 01-1.414 1.414L10 13.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 12 5.293 8.707a1 1 0 010-1.414z" />
                  </svg>
                )}
              </div>

              {/* 메뉴 */}
              <nav className="mt-4">
                {[
                  { title: "대시보드", path: "/" },
                  { title: "회사 검색", path: "/customers" },
                  { title: "최근 상담내역", path: "/consultations/recent" },
                  { title: "문서 관리", path: "/documents" },
                  {
                    title: "견적서 관리",
                    path: "/documents/details?type=estimate&status=pending",
                  },
                  {
                    title: "발주서 관리",
                    path: "/documents/details?type=order&status=pending",
                  },
                  {
                    title: "의뢰서 관리",
                    path: "/documents/details?type=requestQuote&status=pending",
                  },
                  {
                    title: "매입 단가 관리",
                    path: "/products/unit?type=order",
                  },
                  {
                    title: "매출 단가 관리",
                    path: "/products/unit?type=estimate",
                  },
                  {
                    title: "영업 성과 요약",
                    path: `/reports/performance?year=${new Date().getFullYear()}`,
                  },
                  {
                    title: "영업 상세 (매입)",
                    path: `/reports/performance/details?type=order`,
                  },
                  {
                    title: "영업 상세 (매출)",
                    path: `/reports/performance/details?type=estimate`,
                  },
                ].map((menu) => (
                  <Link href={menu.path} key={menu.title}>
                    <div
                      className={`py-2 px-3 cursor-pointer hover:bg-slate-200 transition-all rounded-sm ${
                        isSidebarOpen
                          ? "flex items-center space-x-3"
                          : "flex justify-center"
                      }`}
                    >
                      {isSidebarOpen && <span>{menu.title}</span>}
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* 메인 컨텐츠 */}
            <main className="overflow-auto min-w-0 p-4">{children}</main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}
