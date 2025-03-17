"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import TokenInfo from "./TokenInfo";
import SnackbarComponent from "./Snackbar";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import Image from "next/image";

// 1차 메뉴 아이템 (상단)
interface MainMenuItem {
  id: string;
  title: string;
  subItems: SubMenuItem[];
}

// 2차 메뉴 아이템 (하단)
interface SubMenuItem {
  id: string;
  title: string;
  path: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useLoginUser();
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { favorites, isLoading, isError } = useFavorites(user?.id);

  // 1) 기본 menuSections
  const baseMenuSections = [
    {
      title: "대시보드",
      items: [
        { id: "dashboard", title: "대시보드", path: "/" },
        {
          id: "mySales",
          title: "영업 기록",
          path: `/reports/users/${user?.id}`,
        },
      ],
    },
    {
      title: "거래처 관리",
      items: [
        { id: "customers", title: "거래처 검색", path: "/manage/customers" },
        { id: "contacts", title: "담당자 검색", path: "/manage/contacts" },
        {
          id: "resignContacts",
          title: "퇴사자 검색",
          path: "/manage/contacts/resign",
        },
        { id: "recent", title: "상담내역 조회", path: "/consultations/recent" },
      ],
    },
    {
      title: "문서 관리",
      items: [
        {
          id: "estimate",
          title: "견적서 관리",
          path: "/documents/details?type=estimate&status=all",
        },
        {
          id: "order",
          title: "발주서 관리",
          path: "/documents/details?type=order&status=all",
        },
        {
          id: "requestQuote",
          title: "의뢰서 관리",
          path: "/documents/details?type=requestQuote&status=all",
        },
      ],
    },
    {
      title: "매입/매출 관리",
      items: [
        {
          id: "order-unit",
          title: "매입 단가 관리",
          path: "/products/unit?type=order",
        },
        {
          id: "estimate-unit",
          title: "매출 단가 관리",
          path: "/products/unit?type=estimate",
        },
      ],
    },
  ];

  // role별 추가
  if (user?.role === "research" || user?.role === "admin") {
    baseMenuSections.push({
      title: "연구실",
      items: [
        { id: "rndsorg", title: "지원기관 검색", path: "/manage/orgs" },
        { id: "rnds", title: "R&D 검색", path: "/manage/rnds" },
        { id: "brnds", title: "비 R&D 검색", path: "/manage/brnds" },
      ],
    });
  }
  if (user?.role === "research" || user?.role === "admin") {
    baseMenuSections.push({
      title: "개발",
      items: [
        { id: "develop", title: "개발건 검색", path: "/manage/develop" },
        {
          id: "develop_contacts",
          title: "담당자 검색",
          path: "/manage/develop_contacts",
        },
      ],
    });
  }
  if (user?.role === "managementSupport" || user?.role === "admin") {
    baseMenuSections.push({
      title: "경영지원",
      items: [
        { id: "sales-users", title: "직원", path: "/reports/users" },
        { id: "sales-customers", title: "거래처", path: "/reports/customers" },
        { id: "sales-report", title: "매출/매입 리포트", path: "/reports" },
      ],
    });
  }
  if (user?.role === "admin") {
    baseMenuSections.push({
      title: "관리자",
      items: [
        { id: "logs", title: "로그", path: "/admin/manage/logs" },
        {
          id: "deleteRequest",
          title: "삭제 요청",
          path: "/admin/delete_request",
        },
      ],
    });
  }

  // 2) 즐겨찾기 섹션 + Works 버튼(즐겨찾기에 표시)
  let favoritesSection = null;
  if (!isLoading && !isError) {
    const favItems: SubMenuItem[] = (favorites || []).map((fav: any) => ({
      id: `fav-${fav.id}`,
      title: fav.name,
      path: `/consultations/${fav.item_id}`,
    }));

    // Works를 즐겨찾기에 추가 (원하는 위치에 넣을 수 있음. 여기서는 맨 뒤)
    favItems.push({
      id: "works",
      title: "Naver Works",
      path: "#works", // 특수 키
    });

    if (favItems.length > 0) {
      favoritesSection = {
        title: "즐겨찾기",
        items: favItems,
      };
    }
  }

  // 최종 섹션
  const finalMenuSections = favoritesSection
    ? [favoritesSection, ...baseMenuSections]
    : baseMenuSections;

  // 3) 2단 메뉴 변환
  const mainMenu: MainMenuItem[] = finalMenuSections.map((section) => ({
    id: section.title,
    title: section.title,
    subItems: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
    })),
  }));

  // 상단 메뉴 토글

  const handleMainMenuClick = (id: string) => {
    setActiveMainId((prev) => (prev === id ? null : id));
  };

  // Works 창 열기
  const openWorksWindow = () => {
    if (!user?.worksEmail) return;
    window.open(
      `https://auth.worksmobile.com/login/login?accessUrl=https%3A%2F%2Fmail.worksmobile.com%2F&loginParam=${user?.worksEmail}&language=ko_KR&countryCode=82&serviceCode=login_web`,
      "_blank",
      "width=1800,height=800,top=100,left=100"
    );
  };

  if (isLoading) return null;
  if (isError) return <p>메뉴 데이터를 불러오는 중 오류가 발생했습니다.</p>;

  return (
    <header className="border-b bg-white text-sm text-gray-800">
      {/* 상단 바: WOOYANG CRM(왼쪽), 메인 메뉴(중앙), 사용자 정보(오른쪽) */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* 왼쪽: 로고/브랜드 */}
        <div
          className="font-bold text-lg cursor-pointer"
          onClick={() => router.push("/")}
        >
          WOOYANG CRM
        </div>

        {/* 중앙: 1차 메뉴 */}
        <div className="flex space-x-6">
          {mainMenu.map((menu) => {
            const isActive = menu.id === activeMainId;
            return (
              <button
                key={menu.id}
                onClick={() => handleMainMenuClick(menu.id)}
                className="relative px-2 py-1 hover:text-blue-500"
              >
                <span>{menu.title}</span>
                {/* 활성화된 메뉴에 밑줄 표시 */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 bottom-0 w-full h-[2px] bg-blue-500"
                    layoutId="underline"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 오른쪽: 사용자 정보 + TokenInfo */}
        <div className="flex items-center space-x-2">
          <span>
            {user?.name} {user?.level}님
          </span>
          <TokenInfo />
        </div>
      </div>

      {/* 하단: 2차 메뉴 */}
      <AnimatePresence>
        {activeMainId && (
          <motion.nav
            key="subMenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-gray-200 bg-[#fafafa]"
          >
            {/* 활성화된 상단 메뉴의 subItems 렌더링 */}
            <div className="flex items-center justify-center space-x-4 px-4 py-2">
              {mainMenu
                .find((m) => m.id === activeMainId)
                ?.subItems.map((sub) => {
                  // Works인지 체크
                  if (sub.id === "works") {
                    return (
                      <span
                        key={sub.id}
                        onClick={openWorksWindow}
                        className="cursor-pointer text-gray-600 hover:text-blue-500"
                      >
                        {sub.title}
                      </span>
                    );
                  }

                  // 일반 항목 (pathname 체크)
                  const isCurrentRoute = pathname === sub.path;
                  return (
                    <Link href={sub.path} key={sub.id}>
                      <span
                        className={
                          isCurrentRoute
                            ? "cursor-pointer text-blue-500 font-semibold"
                            : "cursor-pointer text-gray-600 hover:text-blue-500"
                        }
                      >
                        {sub.title}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 스낵바 알림 */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </header>
  );
}
