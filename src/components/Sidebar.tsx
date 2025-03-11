"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "./Snackbar";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import TokenInfo from "./TokenInfo";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface MenuItem {
  id: string; // ✅ 유니크한 ID 추가
  title: string;
  path: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const user = useLoginUser();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openFavorites, setOpenFavorites] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const router = useRouter();

  const { favorites, isLoading, isError, removeFavorite } = useFavorites(
    user?.id
  );

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) return <></>;
  if (isError) return <p>데이터를 불러오는 중 오류가 발생했습니다.</p>;

  const menuSections: MenuSection[] = [
    {
      title: "📊 대시보드",
      items: [
        { id: "dashboard", title: "대시보드", path: "/" },
        {
          id: "mySales",
          title: "영업 기록",
          path: `/reports/users/${user?.id}`,
        },
        // { id: "todos", title: "체크리스트", path: "/my/todos" },
        // { id: "calendar", title: "캘린더", path: "" },
      ],
    },
    // {
    //   title: "📊 게시판",
    //   items: [
    //     { id: "board", title: "공지사항", path: "/notice" },

    //   ],
    // },
    {
      title: "🏢 거래처 관리",
      items: [
        { id: "customers", title: "거래처 검색", path: "/manage/customers" },
        { id: "contacts", title: "담당자 검색", path: "/manage/contacts" },
        {
          id: "resignContacts",
          title: "퇴사자 검색",
          path: "/manage/contacts/resign",
        },
        {
          id: "recent",
          title: "상담내역 조회",
          path: "/consultations/recent",
        },
      ],
    },
    {
      title: "📄 문서 관리",
      items: [
        // { id: "documents", title: "문서 전체", path: "/documents" },
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
      title: "💰 매입/매출 관리",
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

  if (user?.role === "research" || user?.role === "admin") {
    menuSections.push({
      title: "연구개발",
      items: [
        {
          id: "rnds",
          title: "R&D 검색",
          path: `/manage/rnds`,
        },
        {
          id: "brnds",
          title: "비 R&D 검색",
          path: `/manage/brnds`,
        },
      ],
    });
  }

  if (user?.role === "managementSupport" || user?.role === "admin") {
    menuSections.push({
      title: "경영지원",
      items: [
        {
          id: "sales-users",
          title: "직원",
          path: `/reports/users`,
        },
        {
          id: "sales-customers",
          title: "거래처",
          path: `/reports/customers`,
        },
        // {
        //   id: "order-invoice",
        //   title: "매입 세금계산서",
        //   path: `/reports/customers`,
        // },
        // {
        //   id: "estimate-invoice",
        //   title: "매출 세금계산서",
        //   path: `/reports/customers`,
        // },
        {
          id: "sales-report",
          title: "매출/매입 리포트",
          path: "/reports",
        },
        // {
        //   id: "performance",
        //   title: "영업 성과 요약",
        //   path: `/reports/performance?year=${new Date().getFullYear()}`,
        // },
        // {
        //   id: "performance-order",
        //   title: "영업 상세 (매입)",
        //   path: `/reports/performance/details?type=order`,
        // },
        // {
        //   id: "performance-estimate",
        //   title: "영업 상세 (매출)",
        //   path: `/reports/performance/details?type=estimate`,
        // },
      ],
    });
  }

  if (user?.role === "admin") {
    menuSections.push({
      title: "관리자",
      items: [
        {
          id: "logs",
          title: "로그",
          path: "/admin/manage/logs",
        },
        {
          id: "deleteRequest",
          title: "삭제 요청",
          path: "/admin/delete_request",
        },
        // {
        //   id: "manageUsers",
        //   title: "직원 관리",
        //   path: "/admin/manage/users",
        // },
      ],
    });
  }

  return (
    <>
      <motion.div
        className="w-56 h-screen bg-[#F8F8F7] border-r-2 px-2 pt-2 text-sm text-[#5F5E5B] flex flex-col"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* 상단 + 사이드 메뉴(스크롤 영역) */}
        <div className="flex-1 overflow-y-scroll scrollbar-hide">
          <div className="py-1 px-3 rounded-sm flex flex-col text-center space-y-2">
            <div
              onClick={() => router.push("/")}
              className="cursor-pointer font-semibold"
            >
              <p>WOOYANG CRM</p>
            </div>
            <div className="text-sm font-semibold">
              <span>
                {user?.name} {user?.level}님 <TokenInfo />
              </span>
            </div>
          </div>

          <nav className="mt-2 pb-4">
            {" "}
            {/* pb-4 정도로 여유 padding */}
            <div>
              <div
                className="py-2 px-3 cursor-pointer hover:bg-slate-300 rounded-sm font-bold flex justify-between"
                onClick={() => setOpenFavorites((prev) => !prev)}
              >
                ⭐ 즐겨찾기
                <motion.span
                  animate={{ rotate: openFavorites ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▶
                </motion.span>
              </div>

              <AnimatePresence>
                {openFavorites && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {favorites.length > 0 ? (
                      favorites.map((menu: any) => (
                        <motion.div
                          key={menu.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center justify-between py-2 px-4 hover:bg-slate-200 transition-all rounded-sm"
                        >
                          <Link href={`/consultations/${menu.item_id}`}>
                            <span>{menu.name}</span>
                          </Link>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center my-1">
                        즐겨찾기 없음
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {menuSections.map((section) => (
              <div key={section.title}>
                <div
                  className="py-2 px-3 cursor-pointer hover:bg-slate-300 rounded-sm font-bold flex justify-between"
                  onClick={() => toggleSection(section.title)}
                >
                  {section.title}
                  <motion.span
                    animate={{ rotate: openSections[section.title] ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▶
                  </motion.span>
                </div>

                <AnimatePresence>
                  {openSections[section.title] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {section.items.map((menu) => (
                        <Link href={menu.path} key={menu.id}>
                          <div className="py-2 px-4 cursor-pointer hover:bg-slate-200 transition-all rounded-sm">
                            <span>{menu.title}</span>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </div>

        {/* 하단 고정 영역 (works 버튼) */}
        <div
          className="p-2 items-center justify-center flex cursor-pointer transform transition-transform duration-300 hover:scale-105 mb-2"
          onClick={() =>
            window.open(
              `https://auth.worksmobile.com/login/login?accessUrl=https%3A%2F%2Fmail.worksmobile.com%2F&loginParam=${user?.worksEmail}&language=ko_KR&countryCode=82&serviceCode=login_web`,
              "_blank",
              "width=1800,height=800,top=100,left=100"
            )
          }
        >
          <Image src={"/images/works.png"} width="120" height="25" alt="logo" />
        </div>
      </motion.div>

      {/* 스낵바 알림 */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </>
  );
}
