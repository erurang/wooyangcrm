"use client";

import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  ExternalLink,
  User,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import {
  buildSidebarMenu,
  type SidebarMenuItem,
  type SidebarSubItem,
} from "@/constants/sidebarNavigation";
import { Star } from "lucide-react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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

  const allMenuItems = favoritesMenu ? [favoritesMenu, ...menuItems] : menuItems;

  // Toggle submenu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
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

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Open Naver Works
  const openWorksWindow = () => {
    if (!user?.worksEmail) return;
    window.open(
      `https://auth.worksmobile.com/login/login?accessUrl=https%3A%2F%2Fmail.worksmobile.com%2F&loginParam=${user?.worksEmail}&language=ko_KR&countryCode=82&serviceCode=login_web`,
      "_blank",
      "width=1800,height=800,top=100,left=100"
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <span className="font-bold text-gray-800 tracking-tight">
                WOOYANG CRM
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info - 마이페이지 링크 */}
            {user && (
              <Link
                href="/profile"
                className={`block px-4 py-3 border-b border-gray-200 bg-gray-50 hover:bg-indigo-50 active:bg-indigo-100 transition-colors ${
                  pathname.startsWith("/profile") ? "bg-indigo-50" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-3">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name} {user.level}
                    </div>
                    <div className="text-xs text-indigo-600 font-medium">마이페이지</div>
                  </div>
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            )}

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {allMenuItems.map((menu) => {
                const Icon = menu.icon;
                const isMenuExpanded = expandedMenus.includes(menu.id);
                const hasActiveItem = menu.subItems
                  ? hasActiveSubItem(menu.subItems)
                  : false;

                return (
                  <div key={menu.id} className="px-2 mb-1">
                    {/* Menu Header */}
                    <button
                      onClick={() => toggleMenu(menu.id)}
                      className={`
                        w-full flex items-center px-3 py-2.5 rounded-md
                        transition-colors duration-150
                        ${
                          hasActiveItem
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          hasActiveItem ? "text-indigo-600" : "text-gray-500"
                        }`}
                      />
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
                    </button>

                    {/* Sub Items */}
                    {menu.subItems && (
                      <AnimatePresence>
                        {isMenuExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                              {menu.subItems.map((sub) => {
                                const isActive = isActivePath(sub.path);
                                const isWorksLink = sub.id === "works";

                                if (isWorksLink) {
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={openWorksWindow}
                                      className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                                      block px-3 py-2 text-sm rounded-md
                                      transition-colors duration-150
                                      ${
                                        isActive
                                          ? "bg-indigo-100 text-indigo-700 font-medium"
                                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                      }
                                    `}
                                  >
                                    {sub.title}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
