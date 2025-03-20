"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import TokenInfo from "./TokenInfo";
import SnackbarComponent from "./Snackbar";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import Image from "next/image";

interface MainMenuItem {
  id: string;
  title: string;
  subItems: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  title: string;
  path: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useLoginUser();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // 햄버거 메뉴 열림 여부
  const { favorites, isLoading, isError } = useFavorites(user?.id);

  // 1) 기존 menuSections 로직
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
        { id: "search", title: "상담내용 검색", path: "/consultations/search" },
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

  // 2) 즐겨찾기 섹션 + Works
  let favoritesSection = null;
  if (!isLoading && !isError) {
    const favItems: SubMenuItem[] = (favorites || []).map((fav: any) => ({
      id: `fav-${fav.id}`,
      title: fav.name,
      path: `/consultations/${fav.item_id}`,
    }));
    favItems.push({
      id: "works",
      title: "Naver Works",
      path: "#works",
    });
    if (favItems.length > 0) {
      favoritesSection = {
        title: "즐겨찾기",
        items: favItems,
      };
    }
  }

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
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
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

  // 현재 라우트+쿼리 비교
  function isCurrentRouteWithQuery(fullPath: string): boolean {
    const [basePath, queryString] = fullPath.split("?");
    if (pathname !== basePath) return false;

    if (!queryString) {
      return !searchParams.toString();
    }
    const subParams = new URLSearchParams(queryString);
    return subParams.toString() === searchParams.toString();
  }

  if (isLoading) return null;
  if (isError) return <p>메뉴 데이터를 불러오는 중 오류가 발생했습니다.</p>;

  // ----------- UI -----------
  return (
    <>
      {/* 상단 헤더 */}
      <header
        className="
    border-b bg-white text-sm text-gray-800 
    w-full z-50 top-0 left-0
    fixed md:relative
  "
      >
        <div className="flex items-center justify-between px-4 py-2">
          {/* 왼쪽: 로고 */}
          <div
            className="font-bold text-lg cursor-pointer hover:text-blue-500"
            onClick={() => router.push("/")}
          >
            WOOYANG CRM
          </div>

          {/* 데스크톱(일반) 1차 메뉴 */}
          <div className="hidden lg:flex space-x-6">
            {mainMenu.map((menu) => {
              const isActive = menu.id === activeMainId;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleMainMenuClick(menu.id)}
                  className="relative px-2 py-1 hover:text-blue-500"
                >
                  <span>{menu.title}</span>
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

          {/* 모바일/태블릿 햄버거 (lg:hidden) */}
          <div className="lg:hidden">
            <button onClick={() => setMobileMenuOpen(true)}>
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* 데스크톱(일반) 사용자 정보 */}
          <div className="hidden lg:flex items-center space-x-2">
            <span>
              {user?.name} {user?.level}님
            </span>
            <TokenInfo />
          </div>
        </div>

        {/* 데스크톱(일반) 2차 메뉴 */}
        <AnimatePresence>
          {activeMainId && (
            <motion.nav
              key="subMenu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hidden lg:block border-t border-gray-200 bg-[#fafafa]"
            >
              <div className="flex items-center justify-center space-x-4 px-4 py-2">
                {mainMenu
                  .find((m) => m.id === activeMainId)
                  ?.subItems.map((sub) => {
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
                    const isCurrent = isCurrentRouteWithQuery(sub.path);
                    return (
                      <Link href={sub.path} key={sub.id}>
                        <span
                          className={
                            isCurrent
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
      </header>

      {/* 모바일/태블릿 사이드 메뉴 */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        mainMenu={mainMenu}
        activeMainId={activeMainId}
        setActiveMainId={setActiveMainId}
        isCurrentRouteWithQuery={isCurrentRouteWithQuery}
        openWorksWindow={openWorksWindow}
        user={user}
      />

      <div className="pt-14 md:pt-0">{/* 메인 컨텐츠 */}</div>

      {/* 스낵바 알림 */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </>
  );
}

/** 모바일/태블릿용 사이드 패널 */
function MobileSidebar({
  isOpen,
  onClose,
  mainMenu,
  activeMainId,
  setActiveMainId,
  isCurrentRouteWithQuery,
  openWorksWindow,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  mainMenu: MainMenuItem[];
  activeMainId: string | null;
  setActiveMainId: (id: string) => void;
  isCurrentRouteWithQuery: (path: string) => boolean;
  openWorksWindow: () => void;
  user: any;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="mobileMenu"
            className="fixed inset-0 z-50 flex"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2 }}
          >
            {/* 반투명 배경 */}

            {/* 실제 사이드 패널 */}
            <motion.div
              className="relative ml-auto w-3/4 max-w-sm bg-white p-4 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.2 }}
            >
              {/* 닫기 버튼 */}
              <button
                className="self-end mb-4 text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                닫기
              </button>

              {/* 사용자 정보 */}
              <div className="mb-4 border-b pb-2">
                <p className="text-sm font-semibold">
                  <span className="pr-2">
                    {user?.name} {user?.level}님
                  </span>
                  <TokenInfo />
                </p>
              </div>

              {/* 모바일 1차 메뉴 */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {mainMenu.map((menu) => (
                  <div key={menu.id}>
                    <button
                      onClick={() => setActiveMainId(menu.id)}
                      className="w-full text-left font-semibold text-gray-700 py-2"
                    >
                      {menu.title}
                    </button>
                    {/* 하위 메뉴 (2차) */}
                    {activeMainId === menu.id && (
                      <div className="pl-4 space-y-1">
                        {menu.subItems.map((sub) => {
                          if (sub.id === "works") {
                            return (
                              <div
                                key={sub.id}
                                className="cursor-pointer text-sm text-gray-600 hover:text-blue-500"
                                onClick={() => {
                                  openWorksWindow();
                                  onClose();
                                }}
                              >
                                {sub.title}
                              </div>
                            );
                          }
                          const isCurrent = isCurrentRouteWithQuery(sub.path);
                          return (
                            <Link href={sub.path} key={sub.id}>
                              <span
                                onClick={onClose}
                                className={
                                  isCurrent
                                    ? "text-blue-500 font-semibold cursor-pointer text-sm block"
                                    : "text-gray-600 hover:text-blue-500 text-sm block"
                                }
                              >
                                {sub.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
