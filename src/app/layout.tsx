"use client";

import "./globals.css";
import Link from "next/link";
import { LoginUserProvider } from "./context/login";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 사이드바 상태 관리

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div className="flex">
            {/* 사이드바 */}
            <div
              className={`bg-[#F8F8F7] ${
                isSidebarOpen ? "w-52" : "w-12"
              } min-h-screen border-r-2 px-2 pt-2 text-sm text-[#5F5E5B] transition-all duration-300 overflow-hidden`}
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
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.707 14.707a1 1 0 01-1.414 0L4.586 11l3.707-3.707a1 1 0 011.414 1.414L7.414 11l2.293 2.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg
                      role="graphics-symbol"
                      viewBox="0 0 16 16"
                      className="w-5 h-5"
                    >
                      <path d="M2.25781 14.1211C2.47656 14.1211 2.66797 14.0391 2.81836 13.8887L8.14355 8.67969C8.32812 8.49512 8.41699 8.29688 8.41699 8.06445C8.41699 7.8252 8.32812 7.62012 8.14355 7.44922L2.81836 2.24023C2.66797 2.08984 2.4834 2.00781 2.25781 2.00781C1.81348 2.00781 1.46484 2.35645 1.46484 2.80078C1.46484 3.0127 1.55371 3.21777 1.7041 3.375L6.50977 8.05762L1.7041 12.7539C1.55371 12.9043 1.46484 13.1094 1.46484 13.3281C1.46484 13.7725 1.81348 14.1211 2.25781 14.1211ZM8.36914 14.1211C8.58789 14.1211 8.77246 14.0391 8.92285 13.8887L14.2549 8.67969C14.4395 8.49512 14.5283 8.29688 14.5283 8.06445C14.5283 7.8252 14.4326 7.62012 14.2549 7.44922L8.92285 2.24023C8.77246 2.08984 8.58789 2.00781 8.36914 2.00781C7.9248 2.00781 7.56934 2.35645 7.56934 2.80078C7.56934 3.0127 7.66504 3.21777 7.81543 3.375L12.6211 8.05762L7.81543 12.7539C7.66504 12.9043 7.56934 13.1094 7.56934 13.3281C7.56934 13.7725 7.9248 14.1211 8.36914 14.1211Z"></path>
                    </svg>
                  </>
                )}
              </div>

              {isSidebarOpen && (
                <>
                  <div className="py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm">
                    <div className="flex items-center space-x-3">
                      <svg
                        role="graphics-symbol"
                        viewBox="0 0 20 20"
                        className="w-5 h-5"
                      >
                        <path d="M10.1416 3.77299C10.0563 3.71434 9.94368 3.71434 9.85837 3.77299L3.60837 8.06989C3.54053 8.11653 3.5 8.19357 3.5 8.2759V14.2499C3.5 14.9402 4.05964 15.4999 4.75 15.4999H7.5L7.5 10.7499C7.5 10.0595 8.05964 9.49987 8.75 9.49987H11.25C11.9404 9.49987 12.5 10.0595 12.5 10.7499L12.5 15.4999H15.25C15.9404 15.4999 16.5 14.9402 16.5 14.2499V8.2759C16.5 8.19357 16.4595 8.11653 16.3916 8.06989L10.1416 3.77299ZM9.00857 2.53693C9.60576 2.12636 10.3942 2.12636 10.9914 2.53693L17.2414 6.83383C17.7163 7.1603 18 7.69963 18 8.2759V14.2499C18 15.7687 16.7688 16.9999 15.25 16.9999H12.25C11.5596 16.9999 11 16.4402 11 15.7499L11 10.9999H9L9 15.7499C9 16.4402 8.44036 16.9999 7.75 16.9999H4.75C3.23122 16.9999 2 15.7687 2 14.2499V8.2759C2 7.69963 2.2837 7.1603 2.75857 6.83383L9.00857 2.53693Z"></path>
                      </svg>
                      <span>홈</span>
                    </div>
                  </div>
                  <div className="py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm">
                    <Link href={"/customers"}>
                      <div className="flex items-center space-x-3">
                        <svg
                          role="graphics-symbol"
                          viewBox="0 0 20 20"
                          className="w-5 h-5"
                        >
                          <path d="M4 8.75C4 6.12665 6.12665 4 8.75 4C11.3734 4 13.5 6.12665 13.5 8.75C13.5 11.3734 11.3734 13.5 8.75 13.5C6.12665 13.5 4 11.3734 4 8.75ZM8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15C10.2056 15 11.545 14.5024 12.6073 13.668L16.7197 17.7803C17.0126 18.0732 17.4874 18.0732 17.7803 17.7803C18.0732 17.4874 18.0732 17.0126 17.7803 16.7197L13.668 12.6073C14.5024 11.545 15 10.2056 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5Z"></path>
                        </svg>

                        <span>회사 검색</span>
                      </div>
                    </Link>
                  </div>
                  <div className="py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm">
                    <Link href={"/consultations/recent"}>
                      <div className="flex items-center space-x-3">
                        <svg
                          role="graphics-symbol"
                          viewBox="0 0 20 20"
                          className="w-5 h-5"
                        >
                          <path d="M4 8.75C4 6.12665 6.12665 4 8.75 4C11.3734 4 13.5 6.12665 13.5 8.75C13.5 11.3734 11.3734 13.5 8.75 13.5C6.12665 13.5 4 11.3734 4 8.75ZM8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15C10.2056 15 11.545 14.5024 12.6073 13.668L16.7197 17.7803C17.0126 18.0732 17.4874 18.0732 17.7803 17.7803C18.0732 17.4874 18.0732 17.0126 17.7803 16.7197L13.668 12.6073C14.5024 11.545 15 10.2056 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5Z"></path>
                        </svg>

                        <span>최근 상담내역</span>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 메인 영역 */}
            <main className="pt-2 pl-0 pr-0 w-full overflow-x-auto mx-6 mt-2 text-sm">
              {children}
            </main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}

const menuItems = [
  {
    title: "대시보드",
    subItems: [
      { name: "영업현황 개요", path: "/dashboard/overview" },
      { name: "거래성사율", path: "/dashboard/success-rate" },
      { name: "매출 목표 대비 현황", path: "/dashboard/revenue-goal" },
      { name: "취소된 견적 비율", path: "/dashboard/canceled-estimates" },
    ],
  },
  {
    title: "고객 관리",
    subItems: [
      { name: "고객 추가", path: "/customers/addCompany" },
      { name: "고객 목록", path: "/customers" },
    ],
  },
  {
    title: "견적 관리",
    subItems: [
      { name: "견적 목록", path: "/estimates" },
      { name: "견적 추가", path: "/estimates/add" },
    ],
  },
  {
    title: "발주서 관리",
    subItems: [
      { name: "발주서 목록", path: "/orders" },
      { name: "발주서 추가", path: "/orders/add" },
    ],
  },
  {
    title: "문서 관리",
    subItems: [
      { name: "문서 목록", path: "/documents" },
      { name: "문서 업로드", path: "/documents/upload" },
    ],
  },
  {
    title: "영업 상태 관리",
    subItems: [
      { name: "영업 활동 기록", path: "/sales/status" },
      { name: "미팅 일정 관리", path: "/sales/meetings" },
      { name: "영업 기회 분석", path: "/sales/opportunities" },
    ],
  },
  {
    title: "제품 관리",
    subItems: [
      { name: "제품 목록", path: "/products" },
      { name: "제품 추가", path: "/products/add" },
    ],
  },
  {
    title: "분석 및 보고서",
    subItems: [
      { name: "영업 분석 보고서", path: "/reports/sales" },
      { name: "매출 분석 보고서", path: "/reports/revenue" },
      { name: "고객 분석 보고서", path: "/reports/customers" },
    ],
  },
  {
    title: "설정",
    subItems: [
      { name: "사용자 관리", path: "/settings/users" },
      { name: "권한 관리", path: "/settings/permissions" },
      { name: "시스템 설정", path: "/settings/system" },
    ],
  },
  { title: "로그아웃", path: "/logout" },
];

{
  /*
    const pathname = usePathname();
  <div style={{ display: "flex" }}>
          <aside
            style={{ width: "250px", padding: "10px", background: "#f4f4f4" }}
          >
            {menuItems.map((menu) => (
              <div key={menu.title} style={{ marginBottom: "20px" }}>
                <h4>{menu.title}</h4>
                <ul>
                  {menu.subItems ? (
                    menu.subItems.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          href={subItem.path}
                          style={{
                            color: pathname === subItem.path ? "blue" : "black",
                          }}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <Link
                        href={menu.path}
                        style={{
                          color: pathname === menu.path ? "blue" : "black",
                        }}
                      >
                        {menu.title}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </aside>
          <main style={{ flex: 1, padding: "20px" }}>{children}</main>
        </div> */
}
