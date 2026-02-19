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
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useFavorites } from "@/hooks/favorites/useFavorites";
import {
  buildSidebarMenu,
  type SidebarMenuItem,
  type SidebarSubItem,
} from "@/constants/sidebarNavigation";
import { Star } from "lucide-react";
import BoardDropdown from "./BoardDropdown";

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

  const allMenuItems = favoritesMenu ? [favoritesMenu, ...menuItems] : menuItems;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActivePath = (path: string): boolean => {
    const [basePath, queryString] = path.split("?");
    if (pathname !== basePath) return false;
    if (!queryString) return searchParams.toString() === "";
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

  useEffect(() => {
    onClose();
  }, [pathname]);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar Panel - Dark theme matching desktop */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-0 top-0 h-full w-4/5 max-w-sm bg-sidebar-bg shadow-xl z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
              <span className="font-bold text-white tracking-tight">
                WOOYANG CRM
              </span>
              <div className="flex items-center gap-2">
                {process.env.NODE_ENV === "development" && (
                  <span className="px-1.5 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded">
                    DEV
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <Link
                href="/profile"
                className={`block px-4 py-3 border-b border-white/10 transition-colors duration-200 cursor-pointer ${
                  pathname.startsWith("/profile")
                    ? "bg-sidebar-active/30"
                    : "hover:bg-sidebar-hover"
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-medium mr-3">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {user.name} {user.level}
                    </div>
                    <div className="text-xs text-sky-400 font-medium">마이페이지</div>
                  </div>
                </div>
              </Link>
            )}

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
                  <div key={menu.id} className="px-2 mb-0.5">
                    {/* Menu Header */}
                    {menu.path && !menu.subItems ? (
                      <Link
                        href={menu.path}
                        className={`
                          w-full flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                          transition-all duration-200
                          ${
                            hasActiveItem
                              ? "bg-sidebar-active text-white shadow-md shadow-sky-900/30"
                              : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                          }
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            hasActiveItem ? "text-white" : ""
                          }`}
                        />
                        <span className="ml-3 text-sm font-medium truncate flex-1 text-left">
                          {menu.title}
                        </span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (menu.subItems) toggleMenu(menu.id);
                        }}
                        className={`
                          w-full flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                          transition-all duration-200
                          ${
                            hasActiveItem
                              ? "bg-sidebar-hover text-white"
                              : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                          }
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            hasActiveItem ? "text-sky-400" : ""
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
                    )}

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
                                        className="w-full flex items-center px-3 py-2 text-[13px] rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white cursor-pointer transition-colors duration-150"
                                      >
                                        <span>{sub.title}</span>
                                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                                      </button>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={sub.id}
                                      href={sub.path}
                                      className={`
                                        block px-3 py-2 text-[13px] rounded-md cursor-pointer
                                        transition-colors duration-150
                                        ${
                                          isActive
                                            ? "bg-sidebar-active/80 text-white font-medium"
                                            : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                                        }
                                      `}
                                    >
                                      {sub.title}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
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
