"use client";

import { Menu, User } from "lucide-react";
import { useLoginUser } from "@/context/login";
import NotificationBell from "@/components/notifications/NotificationBell";
import TokenInfo from "@/components/TokenInfo";

interface TopBarProps {
  sidebarExpanded: boolean;
  onMobileMenuOpen: () => void;
}

export default function TopBar({ sidebarExpanded, onMobileMenuOpen }: TopBarProps) {
  const user = useLoginUser();

  return (
    <header
      className={`
        fixed top-0 right-0 z-30
        h-14 bg-white border-b border-gray-200
        flex items-center justify-between px-4
        transition-all duration-300
        ${sidebarExpanded ? "lg:left-60" : "lg:left-16"}
        left-0
      `}
    >
      {/* Mobile Menu Button & Logo */}
      <div className="flex items-center">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 mr-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="lg:hidden font-bold text-gray-800 tracking-tight">
          WOOYANG CRM
        </span>
      </div>

      {/* Right Side - User Info */}
      <div className="flex items-center space-x-3">
        <NotificationBell userId={user?.id} />

        <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1.5">
          <User className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm text-gray-700">
            {user?.name} {user?.level}
          </span>
        </div>

        <TokenInfo />
      </div>
    </header>
  );
}
