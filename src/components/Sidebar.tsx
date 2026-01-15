"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import TokenInfo from "./TokenInfo";
import SnackbarComponent from "./Snackbar";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import MobileSidebar from "./navigation/MobileSidebar";
import NotificationBell from "./notifications/NotificationBell";
import {
  buildMenuSections,
  convertToMainMenu,
  type MainMenuItem,
  type SubMenuItem,
} from "@/constants/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useLoginUser();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { favorites, isLoading, isError } = useFavorites(user?.id);
  const [scrolled, setScrolled] = useState(false);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Build menu sections based on user role
  const menuSections = buildMenuSections(user?.id, user?.role);

  // Add favorites section if available
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
    ? [favoritesSection, ...menuSections]
    : menuSections;

  // Convert to main menu format
  const mainMenu: MainMenuItem[] = convertToMainMenu(finalMenuSections);

  // Handle main menu click
  const handleMainMenuClick = (id: string) => {
    if (id === "대시보드") {
      router.push("/");
      return;
    }
    setActiveMainId((prev) => (prev === id ? null : id));
  };

  // Open Naver Works window
  const openWorksWindow = () => {
    if (!user?.worksEmail) return;
    window.open(
      `https://auth.worksmobile.com/login/login?accessUrl=https%3A%2F%2Fmail.worksmobile.com%2F&loginParam=${user?.worksEmail}&language=ko_KR&countryCode=82&serviceCode=login_web`,
      "_blank",
      "width=1800,height=800,top=100,left=100"
    );
  };

  // Check if current route matches path with query params
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

  return (
    <>
      {/* Header */}
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
            {/* Logo */}
            <div
              className="font-bold text-lg cursor-pointer flex items-center text-gray-800 hover:text-indigo-600 transition-colors"
              onClick={() => router.push("/")}
            >
              <span className="tracking-tight">WOOYANG CRM</span>
            </div>

            {/* Desktop Main Menu */}
            <nav className="hidden lg:flex space-x-1">
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
            </nav>

            {/* Mobile Hamburger Button */}
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

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center space-x-3">
              <NotificationBell userId={user?.id} />
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm text-gray-700">
                  {user?.name} {user?.level}님
                </span>
              </div>
              <TokenInfo />
            </div>
          </div>

          {/* Desktop Sub Menu */}
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

      {/* Mobile Sidebar */}
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

      <div className="pt-14 md:pt-0">{/* Main Content Spacer */}</div>

      {/* Snackbar */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </>
  );
}
