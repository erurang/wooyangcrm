"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import TokenInfo from "../TokenInfo";
import NotificationBell from "../notifications/NotificationBell";
import type { MainMenuItem } from "@/constants/navigation";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mainMenu: MainMenuItem[];
  activeMainId: string | null;
  setActiveMainId: (id: string | null) => void;
  isCurrentRouteWithQuery: (path: string) => boolean;
  openWorksWindow: () => void;
  user: { id?: string; name?: string; level?: string } | null | undefined;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  mainMenu,
  activeMainId,
  setActiveMainId,
  isCurrentRouteWithQuery,
  openWorksWindow,
  user,
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Side Panel Container */}
          <motion.div
            key="mobileMenu"
            className="fixed inset-0 z-50 flex"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Side Panel */}
            <motion.div
              className="relative ml-auto w-4/5 max-w-sm bg-white h-full flex flex-col shadow-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="font-bold text-lg text-gray-800">WOOYANG CRM</div>
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
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
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
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
                  <NotificationBell userId={user?.id} />
                </div>
              </div>

              {/* Menu List */}
              <div className="flex-1 overflow-y-auto">
                {mainMenu.map((menu) => (
                  <div key={menu.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Main Menu Button */}
                    <button
                      onClick={() => setActiveMainId(menu.id === activeMainId ? null : menu.id)}
                      className={`
                        w-full text-left p-4 flex justify-between items-center
                        ${activeMainId === menu.id ? "bg-gray-50 text-indigo-600" : "text-gray-700"}
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
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Sub Menu */}
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
                              const isCurrent = isCurrentRouteWithQuery(sub.path);
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
