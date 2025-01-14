"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="ko">
      <body>
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
        </div>
      </body>
    </html>
  );
}
