"use client";

import "./globals.css";
import Link from "next/link";
import { LoginUserProvider } from "./context/login";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ✅ 애니메이션 라이브러리 추가

interface MenuItem {
  title: string;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="ko" data-theme="light">
      <body className="h-screen">
        <LoginUserProvider>
          <div
            className="grid h-screen"
            style={{
              gridTemplateColumns: isSidebarOpen ? "14rem 1fr" : "4rem 1fr",
              transition: "grid-template-columns 0.3s ease-in-out",
            }}
          >
            {/* 사이드바 */}
            <motion.div
              className="bg-[#F8F8F7] min-h-screen border-r-2 px-2 pt-2 text-sm text-[#5F5E5B] transition-all duration-300"
              initial={{ width: isSidebarOpen ? "14rem" : "4rem" }}
              animate={{ width: isSidebarOpen ? "14rem" : "4rem" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* 사이드바 토글 버튼 */}
              <div
                className="py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm flex items-center justify-between"
                onClick={toggleSidebar}
              >
                {isSidebarOpen ? <span>사이드바 닫기</span> : <span>☰</span>}
              </div>

              {/* 카테고리별 그룹화된 메뉴 */}
              <nav className="mt-4">
                {menuSections.map((section) => (
                  <div key={section.title}>
                    {/* 카테고리 제목 */}
                    <div
                      className="py-2 px-3 cursor-pointer hover:bg-slate-300 rounded-sm font-bold flex justify-between"
                      onClick={() => toggleSection(section.title)}
                    >
                      {section.title}
                      <motion.span
                        animate={{
                          rotate: openSections[section.title] ? 90 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        ▶
                      </motion.span>
                    </div>

                    {/* 메뉴 리스트 애니메이션 적용 */}
                    <AnimatePresence>
                      {openSections[section.title] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          {section.items.map((menu) => (
                            <Link href={menu.path} key={menu.title}>
                              <div
                                className={`py-2 px-4 cursor-pointer hover:bg-slate-200 transition-all rounded-sm ${
                                  isSidebarOpen
                                    ? "flex items-center space-x-3"
                                    : "flex justify-center"
                                }`}
                              >
                                {isSidebarOpen && <span>{menu.title}</span>}
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </nav>
            </motion.div>

            {/* 메인 컨텐츠 */}
            <main className="overflow-auto min-w-0 p-4">{children}</main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}

/** 📌 메뉴 리스트 */
const menuSections: MenuSection[] = [
  {
    title: "📊 대시보드",
    items: [{ title: "대시보드", path: "/" }],
  },
  {
    title: "🏢 거래처 관리",
    items: [
      { title: "회사 검색", path: "/customers" },
      { title: "담당자 검색", path: "/manage/contacts" },
      { title: "최근 상담내역", path: "/consultations/recent" },
    ],
  },
  {
    title: "📄 문서 관리",
    items: [
      { title: "문서 전체", path: "/documents" },
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
    ],
  },
  {
    title: "💰 매입/매출 관리",
    items: [
      { title: "매입 단가 관리", path: "/products/unit?type=order" },
      { title: "매출 단가 관리", path: "/products/unit?type=estimate" },
    ],
  },
  {
    title: "📈 영업 성과 분석",
    items: [
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
    ],
  },
];
