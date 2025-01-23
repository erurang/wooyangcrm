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
  // 다크 모드 감지 및 라이트 모드 강제 적

  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div className="flex">
            {/* 사이드바 */}
            <div
              className={`bg-[#F8F8F7] ${
                isSidebarOpen ? "w-52" : "w-14"
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

              {[
                {
                  title: "대시보드",
                  path: "/",
                  icon: (
                    <svg
                      role="graphics-symbol"
                      viewBox="0 0 20 20"
                      className="w-5 h-5"
                    >
                      <path d="M10.1416 3.77299C10.0563 3.71434 9.94368 3.71434 9.85837 3.77299L3.60837 8.06989C3.54053 8.11653 3.5 8.19357 3.5 8.2759V14.2499C3.5 14.9402 4.05964 15.4999 4.75 15.4999H7.5L7.5 10.7499C7.5 10.0595 8.05964 9.49987 8.75 9.49987H11.25C11.9404 9.49987 12.5 10.0595 12.5 10.7499L12.5 15.4999H15.25C15.9404 15.4999 16.5 14.9402 16.5 14.2499V8.2759C16.5 8.19357 16.4595 8.11653 16.3916 8.06989L10.1416 3.77299ZM9.00857 2.53693C9.60576 2.12636 10.3942 2.12636 10.9914 2.53693L17.2414 6.83383C17.7163 7.1603 18 7.69963 18 8.2759V14.2499C18 15.7687 16.7688 16.9999 15.25 16.9999H12.25C11.5596 16.9999 11 16.4402 11 15.7499L11 10.9999H9L9 15.7499C9 16.4402 8.44036 16.9999 7.75 16.9999H4.75C3.23122 16.9999 2 15.7687 2 14.2499V8.2759C2 7.69963 2.2837 7.1603 2.75857 6.83383L9.00857 2.53693Z"></path>
                    </svg>
                  ),
                },
                {
                  title: "회사 검색",
                  path: "/customers",
                  icon: (
                    <svg
                      role="graphics-symbol"
                      viewBox="0 0 20 20"
                      className="w-5 h-5"
                    >
                      <path d="M4 8.75C4 6.12665 6.12665 4 8.75 4C11.3734 4 13.5 6.12665 13.5 8.75C13.5 11.3734 11.3734 13.5 8.75 13.5C6.12665 13.5 4 11.3734 4 8.75ZM8.75 2.5C5.29822 2.5 2.5 5.29822 2.5 8.75C2.5 12.2018 5.29822 15 8.75 15C10.2056 15 11.545 14.5024 12.6073 13.668L16.7197 17.7803C17.0126 18.0732 17.4874 18.0732 17.7803 17.7803C18.0732 17.4874 18.0732 17.0126 17.7803 16.7197L13.668 12.6073C14.5024 11.545 15 10.2056 15 8.75C15 5.29822 12.2018 2.5 8.75 2.5Z"></path>
                    </svg>
                  ),
                },
                {
                  title: "최근 상담내역",
                  path: "/consultations/recent",
                  icon: (
                    <svg
                      role="graphics-symbol"
                      viewBox="0 0 20 20"
                      className="w-5 h-5"
                    >
                      <path d="M9.00992 2.5822C7.37564 1.60345 5.34973 1.8529 4.00205 3.05811C3.69329 3.33423 3.66683 3.80837 3.94295 4.11712C4.21906 4.42588 4.6932 4.45234 5.00196 4.17622C5.874 3.39637 7.18434 3.23731 8.23923 3.86907C8.49682 4.02334 8.71888 4.21224 8.90393 4.42579C9.17518 4.73883 9.64885 4.7727 9.96188 4.50144C10.2749 4.23018 10.3088 3.75652 10.0375 3.44348C9.7497 3.11132 9.40554 2.81913 9.00992 2.5822ZM10.5773 5.23958C11.7812 3.22935 14.3868 2.57569 16.397 3.77958C17.031 4.15924 17.5315 4.6799 17.8804 5.27786C18.0892 5.6356 17.9685 6.09487 17.6107 6.30365C17.253 6.51244 16.7937 6.39169 16.5849 6.03394C16.3601 5.64878 16.038 5.31297 15.6264 5.06646C14.3268 4.2882 12.6425 4.71076 11.8642 6.01027L6.20294 15.4633L10.5234 16.1636C10.9322 16.2299 11.21 16.615 11.1437 17.0239C11.0774 17.4328 10.6922 17.7105 10.2834 17.6443L4.87132 16.767C4.62587 16.7272 4.41609 16.5684 4.31125 16.3429C4.2064 16.1175 4.22013 15.8547 4.34788 15.6414L10.5773 5.23958ZM14.4038 8.94146C14.2934 9.6229 13.6514 10.0858 12.97 9.97532C12.2885 9.86487 11.8257 9.22291 11.9361 8.54147C12.0466 7.86003 12.6885 7.39716 13.37 7.50761C14.0514 7.61806 14.5143 8.26002 14.4038 8.94146ZM7.81488 7.87364C7.70443 8.5551 7.06245 9.01799 6.38099 8.90754C5.69953 8.79708 5.23663 8.15511 5.34709 7.47364C5.45755 6.79218 6.09952 6.32929 6.78099 6.43975C7.46245 6.5502 7.92534 7.19218 7.81488 7.87364Z"></path>
                    </svg>
                  ),
                },
                {
                  title: "문서 관리",
                  path: "/documents",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      className="w-5 h-5"
                    >
                      <g id="SVGRepo_bgCarrier"></g>
                      <g id="SVGRepo_tracerCarrier"></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          stroke="#000000"
                          d="M13 3V10H20M6 7H5C4.44772 7 4 7.44772 4 8V20C4 20.5523 4.44772 21 5 21H14C14.5523 21 15 20.5523 15 20V19M8 4V16C8 16.5523 8.44772 17 9 17H19C19.5523 17 20 16.5523 20 16V9.38898C20 9.13879 19.9062 8.89769 19.7372 8.71326L14.7973 3.32428C14.6078 3.11765 14.3404 3 14.0601 3H9C8.44772 3 8 3.44772 8 4Z"
                        ></path>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "견적서 관리",
                  path: "/documents/details?type=estimate&status=pending",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      className="w-5 h-5"
                    >
                      <g id="SVGRepo_bgCarrier"></g>
                      <g id="SVGRepo_tracerCarrier"></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          stroke="#000000"
                          d="M13 3V10H20M6 7H5C4.44772 7 4 7.44772 4 8V20C4 20.5523 4.44772 21 5 21H14C14.5523 21 15 20.5523 15 20V19M8 4V16C8 16.5523 8.44772 17 9 17H19C19.5523 17 20 16.5523 20 16V9.38898C20 9.13879 19.9062 8.89769 19.7372 8.71326L14.7973 3.32428C14.6078 3.11765 14.3404 3 14.0601 3H9C8.44772 3 8 3.44772 8 4Z"
                        ></path>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "발주서 관리",
                  path: "/documents/details?type=order&status=pending",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      className="w-5 h-5"
                    >
                      <g id="SVGRepo_bgCarrier"></g>
                      <g id="SVGRepo_tracerCarrier"></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          stroke="#000000"
                          d="M13 3V10H20M6 7H5C4.44772 7 4 7.44772 4 8V20C4 20.5523 4.44772 21 5 21H14C14.5523 21 15 20.5523 15 20V19M8 4V16C8 16.5523 8.44772 17 9 17H19C19.5523 17 20 16.5523 20 16V9.38898C20 9.13879 19.9062 8.89769 19.7372 8.71326L14.7973 3.32428C14.6078 3.11765 14.3404 3 14.0601 3H9C8.44772 3 8 3.44772 8 4Z"
                        ></path>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "의뢰서 관리",
                  path: "/documents/details?type=requestQuote&status=pending",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      className="w-5 h-5"
                    >
                      <g id="SVGRepo_bgCarrier"></g>
                      <g id="SVGRepo_tracerCarrier"></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          stroke="#000000"
                          d="M13 3V10H20M6 7H5C4.44772 7 4 7.44772 4 8V20C4 20.5523 4.44772 21 5 21H14C14.5523 21 15 20.5523 15 20V19M8 4V16C8 16.5523 8.44772 17 9 17H19C19.5523 17 20 16.5523 20 16V9.38898C20 9.13879 19.9062 8.89769 19.7372 8.71326L14.7973 3.32428C14.6078 3.11765 14.3404 3 14.0601 3H9C8.44772 3 8 3.44772 8 4Z"
                        ></path>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "매입 단가 관리",
                  path: "/products/unit?type=order",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#000000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <title></title>{" "}
                        <g
                          fill="none"
                          fillRule="evenodd"
                          id="页面-1"
                          stroke="none"
                          strokeWidth="1"
                        >
                          {" "}
                          <g
                            id="导航图标"
                            transform="translate(-325.000000, -80.000000)"
                          >
                            {" "}
                            <g
                              id="编组"
                              transform="translate(325.000000, 80.000000)"
                            >
                              {" "}
                              <polygon
                                fill="#FFFFFF"
                                fillOpacity="0.01"
                                fillRule="nonzero"
                                id="路径"
                                points="24 0 0 0 0 24 24 24"
                              ></polygon>{" "}
                              <polygon
                                id="路径"
                                points="22 7 12 2 2 7 2 17 12 22 22 17"
                                stroke="#000000"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                              ></polygon>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="2"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="12"
                                x2="12"
                                y1="22"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="22"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="17"
                                x2="7"
                                y1="4.5"
                                y2="9.5"
                              ></line>{" "}
                            </g>{" "}
                          </g>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "매출 단가 관리",
                  path: "/products/unit?type=estimate",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#000000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <title></title>{" "}
                        <g
                          fill="none"
                          fillRule="evenodd"
                          id="页面-1"
                          stroke="none"
                          strokeWidth="1"
                        >
                          {" "}
                          <g
                            id="导航图标"
                            transform="translate(-325.000000, -80.000000)"
                          >
                            {" "}
                            <g
                              id="编组"
                              transform="translate(325.000000, 80.000000)"
                            >
                              {" "}
                              <polygon
                                fill="#FFFFFF"
                                fillOpacity="0.01"
                                fillRule="nonzero"
                                id="路径"
                                points="24 0 0 0 0 24 24 24"
                              ></polygon>{" "}
                              <polygon
                                id="路径"
                                points="22 7 12 2 2 7 2 17 12 22 22 17"
                                stroke="#000000"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                              ></polygon>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="2"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="12"
                                x2="12"
                                y1="22"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="22"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="17"
                                x2="7"
                                y1="4.5"
                                y2="9.5"
                              ></line>{" "}
                            </g>{" "}
                          </g>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  ),
                },
                {
                  title: "영업 성과 요약",
                  path: `/reports/performance?year=${new Date().getFullYear()}`,
                  icon: (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#000000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <title></title>{" "}
                        <g
                          fill="none"
                          fillRule="evenodd"
                          id="页面-1"
                          stroke="none"
                          strokeWidth="1"
                        >
                          {" "}
                          <g
                            id="导航图标"
                            transform="translate(-325.000000, -80.000000)"
                          >
                            {" "}
                            <g
                              id="编组"
                              transform="translate(325.000000, 80.000000)"
                            >
                              {" "}
                              <polygon
                                fill="#FFFFFF"
                                fillOpacity="0.01"
                                fillRule="nonzero"
                                id="路径"
                                points="24 0 0 0 0 24 24 24"
                              ></polygon>{" "}
                              <polygon
                                id="路径"
                                points="22 7 12 2 2 7 2 17 12 22 22 17"
                                stroke="#000000"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                              ></polygon>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="2"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="12"
                                x2="12"
                                y1="22"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="22"
                                x2="12"
                                y1="7"
                                y2="12"
                              ></line>{" "}
                              <line
                                id="路径"
                                stroke="#000000"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                x1="17"
                                x2="7"
                                y1="4.5"
                                y2="9.5"
                              ></line>{" "}
                            </g>{" "}
                          </g>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  ),
                },
              ].map((menu) => (
                <Link href={menu.path} key={menu.title}>
                  <div
                    className={`py-1 px-2 cursor-pointer hover:bg-slate-200 transition-all rounded-sm ${
                      isSidebarOpen
                        ? "flex items-center space-x-3"
                        : "flex justify-center"
                    }`}
                  >
                    {menu.icon}
                    {isSidebarOpen && <span>{menu.title}</span>}
                  </div>
                </Link>
              ))}
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
