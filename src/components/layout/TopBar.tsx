"use client";

import { useState, useEffect } from "react";
import { Menu, User, ZoomIn, ZoomOut } from "lucide-react";
import { useLoginUser } from "@/context/login";
import NotificationBell from "@/components/notifications/NotificationBell";
import TokenInfo from "@/components/TokenInfo";

interface TopBarProps {
  sidebarExpanded: boolean;
  onMobileMenuOpen: () => void;
}

const ZOOM_LEVELS = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
const DEFAULT_ZOOM = 0.8;

export default function TopBar({ sidebarExpanded, onMobileMenuOpen }: TopBarProps) {
  const user = useLoginUser();
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  // localStorage에서 zoom 값 불러오기
  useEffect(() => {
    const savedZoom = localStorage.getItem("app-zoom");
    if (savedZoom) {
      const parsedZoom = parseFloat(savedZoom);
      setZoom(parsedZoom);
      document.body.style.zoom = String(parsedZoom);
    }
  }, []);

  // zoom 변경 시 적용
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    document.body.style.zoom = String(newZoom);
    localStorage.setItem("app-zoom", String(newZoom));
  };

  const zoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      handleZoomChange(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      handleZoomChange(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

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
        {/* Zoom Control */}
        <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-1 py-0.5">
          <button
            onClick={zoomOut}
            disabled={zoom <= ZOOM_LEVELS[0]}
            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <span className="text-xs text-gray-600 min-w-[36px] text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>

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
