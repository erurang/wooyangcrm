"use client";

import { useSidebar } from "@/hooks/useSidebar";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileSidebar from "./MobileSidebar";
import Breadcrumb from "./Breadcrumb";
import AnnouncementModal from "@/components/announcements/AnnouncementModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isExpanded, isMobileOpen, toggle, openMobile, closeMobile, isHydrated } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar isExpanded={isExpanded} onToggle={toggle} />

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileOpen} onClose={closeMobile} />

      {/* Top Bar */}
      <TopBar sidebarExpanded={isExpanded} onMobileMenuOpen={openMobile} />

      {/* Main Content */}
      <main
        className={`
          pt-14 min-h-screen
          transition-all duration-300
          ${isHydrated ? (isExpanded ? "lg:pl-60" : "lg:pl-16") : "lg:pl-16"}
        `}
      >
        <div className="p-2 sm:p-4">
          <Breadcrumb />
          {children}
        </div>
      </main>

      {/* 공지사항 모달 (로그인 시 자동 표시) */}
      <AnnouncementModal />
    </div>
  );
}
