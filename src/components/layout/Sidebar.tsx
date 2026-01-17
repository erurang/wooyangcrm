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

  // Build menu based on user role
  const menuItems = buildSidebarMenu(user?.id, user?.role);

  // Build favorites menu
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

  // Refs for menu items to scroll into view
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Toggle submenu expansion with scroll into view
  const toggleMenu = (menuId: string) => {
    const isCurrentlyExpanded = expandedMenus.includes(menuId);

    setExpandedMenus((prev) =>
      isCurrentlyExpanded
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );

    // Scroll into view when expanding (after animation)
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        const element = menuRefs.current[menuId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 250); // Wait for animation to complete
    }
  };

  // Check if path matches current route
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

  // Check if any subitem is active
  const hasActiveSubItem = (subItems: SidebarSubItem[]): boolean => {
    return subItems.some((sub) => isActivePath(sub.path));
  };

  // Auto-expand menus with active items
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

  // Open Naver Works
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
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        hidden lg:flex flex-col
        ${isExpanded ? "w-60" : "w-16"}
      `}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200">
        <span className="font-bold text-gray-800 tracking-tight whitespace-nowrap">
          WOOYANG CRM
        </span>
        {/* {isExpanded ? (
          <span className="font-bold text-gray-800 tracking-tight whitespace-nowrap">
            WOOYANG CRM
          </span>
        ) : (
          <span className="font-bold text-gray-800 text-lg mx-auto">W</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title={isExpanded ? "접기" : "펼치기"}
        >
          {isExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button> */}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-2">
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
              className="px-2 mb-1"
            >
              {/* Menu Header */}
              {menu.path && !menu.subItems ? (
                // Direct link menu (no sub-items)
                <Link
                  href={menu.path}
                  className={`
                    w-full flex items-center rounded-md
                    transition-colors duration-150
                    ${isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center"}
                    ${
                      hasActiveItem
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                  title={!isExpanded ? menu.title : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      hasActiveItem ? "text-indigo-600" : "text-gray-500"
                    }`}
                  />
                  {isExpanded && (
                    <span className="ml-3 text-sm font-medium truncate flex-1 text-left">
                      {menu.title}
                    </span>
                  )}
                </Link>
              ) : (
                // Expandable menu with subItems
                <button
                  onClick={() => {
                    if (menu.subItems) {
                      toggleMenu(menu.id);
                    }
                  }}
                  className={`
                    w-full flex items-center rounded-md
                    transition-colors duration-150
                    ${isExpanded ? "px-3 py-2" : "px-0 py-2 justify-center"}
                    ${
                      hasActiveItem
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                  title={!isExpanded ? menu.title : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      hasActiveItem ? "text-indigo-600" : "text-gray-500"
                    }`}
                  />
                  {isExpanded && (
                    <>
                      <span className="ml-3 text-sm font-medium truncate flex-1 text-left">
                        {menu.title}
                      </span>
                      {menu.subItems && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
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
                        <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                          {menu.subItems.map((sub) => {
                            const isActive = isActivePath(sub.path);
                            const isWorksLink = sub.id === "works";

                            if (isWorksLink) {
                              return (
                                <button
                                  key={sub.id}
                                  onClick={openWorksWindow}
                                  className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                >
                                  <span className="truncate">{sub.title}</span>
                                  <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                                </button>
                              );
                            }

                            return (
                              <Link
                                key={sub.id}
                                href={sub.path}
                                className={`
                                  block px-2 py-1.5 text-sm rounded-md
                                  transition-colors duration-150
                                  ${
                                    isActive
                                      ? "bg-indigo-100 text-indigo-700 font-medium"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48">
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                              className="w-full flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <span>{sub.title}</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          );
                        }

                        return (
                          <Link
                            key={sub.id}
                            href={sub.path}
                            className={`
                              block px-3 py-1.5 text-sm
                              ${
                                isActive
                                  ? "bg-indigo-50 text-indigo-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }
                            `}
                          >
                            {sub.title}
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
        <div className="border-t border-gray-200 p-2">
          <Link
            href="/profile"
            className={`
              flex items-center rounded-md transition-colors duration-150
              hover:bg-indigo-50
              ${isExpanded ? "px-3 py-2 gap-3" : "justify-center py-2"}
              ${pathname.startsWith("/profile") ? "bg-indigo-50" : ""}
            `}
            title={!isExpanded ? `${user.name} ${user.level} - 마이페이지` : undefined}
          >
            <div
              className={`
                rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm flex-shrink-0
                ${isExpanded ? "w-8 h-8" : "w-10 h-10"}
              `}
            >
              {user.name?.charAt(0) || "U"}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name} {user.level}
                </div>
                <div className="text-xs text-gray-500">마이페이지</div>
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
