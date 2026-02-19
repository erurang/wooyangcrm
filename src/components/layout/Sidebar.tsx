"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  ExternalLink,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import {
  buildSidebarMenu,
  type SidebarMenuItem,
  type SidebarSubItem,
} from "@/constants/sidebarNavigation";
import BoardDropdown from "./BoardDropdown";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useLoginUser();
  const { favorites, isLoading: favLoading } = useFavorites(user?.id);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const menuItems = buildSidebarMenu(
    user?.id,
    user?.role,
    user?.position,
    user?.team?.allowed_menus,
    user?.sidebarPermissions
  );

  const favoritesMenu: SidebarMenuItem | null =
    !favLoading && favorites && favorites.length > 0
      ? {
          id: "favorites",
          title: "즐겨찾기",
          icon: Star,
          subItems: [
            ...favorites.map((fav: any) => ({
              id: `fav-${fav.id}`,
              title: fav.name,
              path: `/consultations/${fav.item_id}`,
            })),
            {
              id: "works",
              title: "Naver Works",
              path: "#works",
            },
          ],
        }
      : null;

  const allMenuItems = favoritesMenu
    ? [favoritesMenu, ...menuItems]
    : menuItems;

  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const toggleMenu = (menuId: string) => {
    const isCurrentlyExpanded = expandedMenus.includes(menuId);

    setExpandedMenus((prev) =>
      isCurrentlyExpanded
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );

    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const element = menuRefs.current[menuId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 250);
    }
  };

  const isActivePath = (path: string): boolean => {
    const [basePath, queryString] = path.split("?");

    if (pathname !== basePath) return false;

    if (!queryString) {
      return searchParams.toString() === "";
    }

    const pathParams = new URLSearchParams(queryString);
    for (const [key, value] of pathParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  const hasActiveSubItem = (subItems: SidebarSubItem[]): boolean => {
    return subItems.some((sub) => isActivePath(sub.path));
  };

  useEffect(() => {
    const activeMenus: string[] = [];
    allMenuItems.forEach((menu) => {
      if (menu.subItems && hasActiveSubItem(menu.subItems)) {
        activeMenus.push(menu.id);
      }
    });
    if (activeMenus.length > 0) {
      setExpandedMenus((prev) => [...new Set([...prev, ...activeMenus])]);
    }
  }, [pathname, searchParams]);

  const openWorksWindow = () => {
    if (!user?.worksEmail) return;
    window.open(
      `https://auth.worksmobile.com/login/login?accessUrl=https%3A%2F%2Fmail.worksmobile.com%2F&loginParam=${user?.worksEmail}&language=ko_KR&countryCode=82&serviceCode=login_web`,
      "_blank",
      "width=1800,height=800,top=100,left=100"
    );
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        bg-sidebar-bg
        transition-all duration-300 ease-in-out
        hidden lg:flex flex-col
        ${isExpanded ? "w-60" : "w-16"}
      `}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-white/10">
        {isExpanded ? (
          <Link
            href="/dashboard"
            className="font-bold text-white tracking-tight whitespace-nowrap hover:text-sky-400 transition-colors duration-200"
          >
            WOOYANG CRM
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="font-bold text-white text-lg mx-auto hover:text-sky-400 transition-colors duration-200"
          >
            W
          </Link>
        )}
        {isExpanded && (
          <>
            {process.env.NODE_ENV === "development" && (
              <span className="px-1.5 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded">
                DEV
              </span>
            )}
          </>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {allMenuItems.map((menu) => {
          const Icon = menu.icon;
          const isMenuExpanded = expandedMenus.includes(menu.id);
          const hasActiveItem = menu.subItems
            ? hasActiveSubItem(menu.subItems)
            : menu.path
            ? isActivePath(menu.path)
            : false;

          return (
            <div
              key={menu.id}
              ref={(el) => {
                menuRefs.current[menu.id] = el;
              }}
              className="px-2 mb-0.5"
            >
              {/* Menu Header */}
              {menu.path && !menu.subItems ? (
                <Link
                  href={menu.path}
                  className={`
                    w-full flex items-center rounded-lg cursor-pointer
                    transition-all duration-200
                    ${isExpanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                    ${
                      hasActiveItem
                        ? "bg-sidebar-active text-white shadow-md shadow-sky-900/30"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                    }
                  `}
                  title={!isExpanded ? menu.title : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${
                      hasActiveItem ? "text-white" : ""
                    }`}
                  />
                  {isExpanded && (
                    <span className="ml-3 text-[13px] font-medium truncate flex-1 text-left">
                      {menu.title}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (menu.subItems) {
                      toggleMenu(menu.id);
                    }
                  }}
                  className={`
                    w-full flex items-center rounded-lg cursor-pointer
                    transition-all duration-200
                    ${isExpanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                    ${
                      hasActiveItem
                        ? "bg-sidebar-hover text-white"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                    }
                  `}
                  title={!isExpanded ? menu.title : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${
                      hasActiveItem ? "text-sky-400" : ""
                    }`}
                  />
                  {isExpanded && (
                    <>
                      <span className="ml-3 text-[13px] font-medium truncate flex-1 text-left">
                        {menu.title}
                      </span>
                      {menu.subItems && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isMenuExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>
              )}

              {/* Sub Items */}
              {isExpanded && menu.subItems && (
                <AnimatePresence>
                  {isMenuExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {menu.id === "board" ? (
                        <BoardDropdown isExpanded={isMenuExpanded} />
                      ) : (
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                          {menu.subItems.map((sub) => {
                            const isActive = isActivePath(sub.path);
                            const isWorksLink = sub.id === "works";

                            if (isWorksLink) {
                              return (
                                <button
                                  key={sub.id}
                                  onClick={openWorksWindow}
                                  className="w-full flex items-center px-2 py-1.5 text-[13px] rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors duration-150 cursor-pointer"
                                >
                                  <span className="truncate">{sub.title}</span>
                                  <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0 opacity-50" />
                                </button>
                              );
                            }

                            return (
                              <Link
                                key={sub.id}
                                href={sub.path}
                                className={`
                                  flex items-center justify-between px-2 py-1.5 text-[13px] rounded-md
                                  transition-colors duration-150 cursor-pointer
                                  ${
                                    isActive
                                      ? "bg-sidebar-active/80 text-white font-medium"
                                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                                  }
                                `}
                              >
                                <span className="truncate">{sub.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Collapsed State - Show popup on hover */}
              {!isExpanded && menu.subItems && (
                <div className="group relative">
                  <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                    <div className="bg-white rounded-xl shadow-crm-xl border border-slate-100 py-2 min-w-48">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {menu.title}
                      </div>
                      {menu.subItems.map((sub) => {
                        const isActive = isActivePath(sub.path);
                        const isWorksLink = sub.id === "works";

                        if (isWorksLink) {
                          return (
                            <button
                              key={sub.id}
                              onClick={openWorksWindow}
                              className="w-full flex items-center px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors duration-150"
                            >
                              <span>{sub.title}</span>
                              <ExternalLink className="w-3 h-3 ml-1 opacity-40" />
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={sub.id}
                            href={sub.path}
                            className={`
                              flex items-center justify-between px-3 py-2 text-sm cursor-pointer
                              transition-colors duration-150
                              ${
                                isActive
                                  ? "bg-sky-50 text-sky-700 font-medium"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                              }
                            `}
                          >
                            <span>{sub.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="border-t border-white/10 p-2">
          <Link
            href="/profile"
            className={`
              flex items-center rounded-lg transition-all duration-200 cursor-pointer
              hover:bg-sidebar-hover
              ${isExpanded ? "px-3 py-2.5 gap-3" : "justify-center py-2.5"}
              ${pathname.startsWith("/profile") ? "bg-sidebar-hover" : ""}
            `}
            title={!isExpanded ? `${user.name} ${user.level} - 마이페이지` : undefined}
          >
            <div
              className={`
                rounded-full bg-sky-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0
                ${isExpanded ? "w-8 h-8" : "w-10 h-10"}
              `}
            >
              {user.name?.charAt(0) || "U"}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white truncate">
                  {user.name} {user.level}
                </div>
                <div className="text-[11px] text-sidebar-text">마이페이지</div>
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
