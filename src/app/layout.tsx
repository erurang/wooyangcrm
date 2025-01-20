"use client";

import "./globals.css";

import Link from "next/link";

import { LoginUserProvider, useLoginUser } from "./context/login";

interface UserData {
  email: string;
  role: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div className="flex">
            <div className="bg-[#F8F8F7] w-52 min-h-screen border-r-2 px-2 pt-2 text-sm text-[#5F5E5B]">
              <div className="py-1 px-2 cursor-pointer hover:bg-slate-200  transition-all rounded-sm">
                <div>
                  {/* <span className="pr-2">icon</span> */}
                  {/* <span>{loginUser.name}님, 반갑습니다!</span> */}
                  <span></span>
                </div>
              </div>
              <div className="py-1 px-2 cursor-pointer hover:bg-slate-200  transition-all rounded-sm">
                <Link href={"/customers"}>
                  <div>
                    <span className="pr-2">icon</span>
                    <span>회사 검색</span>
                  </div>
                </Link>
              </div>
              <div className="py-1 px-2 cursor-pointer hover:bg-slate-200  transition-all rounded-sm">
                <div>
                  <span className="pr-2">icon</span>
                  <span>user.name</span>
                </div>
              </div>
              <div className="py-1 px-2 cursor-pointer hover:bg-slate-200  transition-all rounded-sm">
                <div>
                  <span className="pr-2">icon</span>
                  <span>user.name</span>
                </div>
              </div>
            </div>
            {/* main 영역을 w-full로 꽉 차게 설정하고 overflow-x-auto로 스크롤 추가 */}
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
