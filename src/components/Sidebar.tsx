"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import TokenInfo from "./TokenInfo";
import SnackbarComponent from "./Snackbar";
import { useFavorites } from "@/hooks/favorites/useFavorites";

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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { favorites, isLoading, isError } = useFavorites(user?.id);
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 감지 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        {
          id: "follow_search",
          title: "후속상담 검색",
          path: "/consultations/follow",
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
    // {
    //   title: "캘린더",
    //   items: [
    //     {
    //       id: "manage/calendar/todos",
    //       title: "할 일",
    //       path: "/manage/calendar/todos",
    //     },
    //     {
    //       id: "manage/calendar/consultations",
    //       title: "상담",
    //       path: "/manage/calendar/consultations",
    //     },
    //     {
    //       id: "manage/calendar/documents",
    //       title: "문서",
    //       path: "/manage/calendar/documents",
    //     },
    //   ],
    // },
  ];

  // role별 추가
  if (user?.role === "research" || user?.role === "admin") {
    baseMenuSections.push({
      title: "연구실",
      items: [
        { id: "rndsorg", title: "지원기관 검색", path: "/manage/orgs" },
        { id: "rnds", title: "R&D 검색", path: "/manage/rnds" },
        { id: "brnds", title: "비 R&D 검색", path: "/manage/brnds" },
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
    // If dashboard is clicked, navigate to root path directly
    if (id === "대시보드") {
      router.push("/");
      return;
    }
    // Otherwise, toggle the dropdown as usual
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
        className={`
          w-full z-50 top-0 left-0
          fixed md:relative
          transition-all duration-200
          ${scrolled ? "shadow-md" : "shadow-sm"}
          bg-white
        `}
      >
        <div className="w-full">
          <div className="flex items-center justify-between px-6 py-3">
            {/* 왼쪽: 로고 */}
            <div
              className="font-bold text-lg cursor-pointer flex items-center text-gray-800 hover:text-indigo-600 transition-colors"
              onClick={() => router.push("/")}
            >
              <span className="tracking-tight">WOOYANG CRM</span>
            </div>

            {/* 데스크톱(일반) 1차 메뉴 */}
            <div className="hidden lg:flex space-x-1">
              {mainMenu.map((menu) => {
                const isActive = menu.id === activeMainId;
                return (
                  <button
                    key={menu.id}
                    onClick={() => handleMainMenuClick(menu.id)}
                    className={`
                      relative px-3 py-2 rounded-md
                      transition-all duration-200
                      ${
                        isActive
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{menu.title}</span>
                  </button>
                );
              })}
            </div>

            {/* 모바일/태블릿 햄버거 (lg:hidden) */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-6 h-6"
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
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="text-sm text-gray-700">
                  {user?.name} {user?.level}님
                </span>
              </div>
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
                transition={{ duration: 0.2 }}
                className="hidden lg:block border-t border-gray-100 bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-center gap-1 px-6 py-2">
                  {mainMenu
                    .find((m) => m.id === activeMainId)
                    ?.subItems.map((sub) => {
                      if (sub.id === "works") {
                        return (
                          <span
                            key={sub.id}
                            onClick={openWorksWindow}
                            className="px-3 py-1.5 text-sm rounded-md cursor-pointer text-gray-600 hover:text-indigo-600 hover:bg-white transition-colors"
                          >
                            {sub.title}
                          </span>
                        );
                      }
                      const isCurrent = isCurrentRouteWithQuery(sub.path);
                      return (
                        <Link href={sub.path} key={sub.id}>
                          <span
                            className={`
                              px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors
                              ${
                                isCurrent
                                  ? "bg-white text-indigo-600 font-medium shadow-sm"
                                  : "text-gray-600 hover:text-indigo-600 hover:bg-white"
                              }
                            `}
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
        </div>
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
  setActiveMainId: (id: string | null) => void; // 여기를 수정했습니다: string | null로 변경
  isCurrentRouteWithQuery: (path: string) => boolean;
  openWorksWindow: () => void;
  user: any;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="mobileMenu"
            className="fixed inset-0 z-50 flex"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* 실제 사이드 패널 */}
            <motion.div
              className="relative ml-auto w-4/5 max-w-sm bg-white h-full flex flex-col shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* 헤더 영역 */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="font-bold text-lg text-gray-800">
                  WOOYANG CRM
                </div>
                <button
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={onClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* 사용자 정보 */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {user?.name} {user?.level}님
                    </p>
                    <div className="text-xs text-gray-500">
                      <TokenInfo />
                    </div>
                  </div>
                </div>
              </div>

              {/* 모바일 메뉴 */}
              <div className="flex-1 overflow-y-auto">
                {mainMenu.map((menu) => (
                  <div
                    key={menu.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <button
                      onClick={() =>
                        setActiveMainId(
                          menu.id === activeMainId ? null : menu.id
                        )
                      }
                      className={`
                        w-full text-left p-4 flex justify-between items-center
                        ${
                          activeMainId === menu.id
                            ? "bg-gray-50 text-indigo-600"
                            : "text-gray-700"
                        }
                      `}
                    >
                      <span className="font-medium">{menu.title}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${
                          activeMainId === menu.id ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    {/* 하위 메뉴 (2차) */}
                    <AnimatePresence>
                      {activeMainId === menu.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50 overflow-hidden"
                        >
                          <div className="p-2 space-y-1">
                            {menu.subItems.map((sub) => {
                              if (sub.id === "works") {
                                return (
                                  <div
                                    key={sub.id}
                                    className="p-2 rounded-md text-sm text-gray-600 hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                                    onClick={() => {
                                      openWorksWindow();
                                      onClose();
                                    }}
                                  >
                                    {sub.title}
                                  </div>
                                );
                              }
                              const isCurrent = isCurrentRouteWithQuery(
                                sub.path
                              );
                              return (
                                <Link href={sub.path} key={sub.id}>
                                  <span
                                    onClick={onClose}
                                    className={`
                                      block p-2 rounded-md text-sm cursor-pointer transition-colors
                                      ${
                                        isCurrent
                                          ? "bg-white text-indigo-600 font-medium shadow-sm"
                                          : "text-gray-600 hover:bg-white hover:text-indigo-600"
                                      }
                                    `}
                                  >
                                    {sub.title}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
