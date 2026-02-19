"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, User, ZoomIn, ZoomOut, TrendingUp } from "lucide-react";
import { useLoginUser } from "@/context/login";
import NotificationBell from "@/components/notifications/NotificationBell";
import TokenInfo from "@/components/TokenInfo";
import { useExchangeRates } from "@/hooks/useExchangeRate";

interface TopBarProps {
  sidebarExpanded: boolean;
  onMobileMenuOpen: () => void;
}

const ZOOM_LEVELS = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
const DEFAULT_ZOOM = 0.8;

export default function TopBar({ sidebarExpanded, onMobileMenuOpen }: TopBarProps) {
  const user = useLoginUser();
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const { rates, isLoading: ratesLoading } = useExchangeRates();

  useEffect(() => {
    const savedZoom = localStorage.getItem("app-zoom");
    if (savedZoom) {
      const parsedZoom = parseFloat(savedZoom);
      setZoom(parsedZoom);
      document.body.style.zoom = String(parsedZoom);
    }
  }, []);

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
        h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60
        flex items-center justify-between px-4
        transition-all duration-300
        ${sidebarExpanded ? "lg:left-60" : "lg:left-16"}
        left-0
      `}
    >
      {/* Mobile Menu Button & Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors duration-200"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link
          href="/dashboard"
          className="lg:hidden font-bold text-slate-800 tracking-tight hover:text-sky-600 transition-colors duration-200"
        >
          WOOYANG CRM
        </Link>
        {process.env.NODE_ENV === "development" && (
          <span className="lg:hidden ml-1 px-1.5 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded">
            DEV
          </span>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Zoom Control */}
        <div className="hidden sm:flex items-center bg-slate-100/80 rounded-full px-1.5 py-0.5">
          <button
            onClick={zoomOut}
            disabled={zoom <= ZOOM_LEVELS[0]}
            className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <span className="text-[11px] text-slate-600 min-w-[36px] text-center font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* Exchange Rate Display */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50/80 rounded-lg border border-slate-100">
          {rates && rates.length > 0 ? (
            <>
              {rates.find(r => r.currency === "USD") && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">USD</span>
                  <span className="text-[11px] font-medium text-slate-700 tabular-nums">
                    ₩{rates.find(r => r.currency === "USD")?.rate.toLocaleString()}
                  </span>
                </div>
              )}
              {rates.find(r => r.currency === "EUR") && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">EUR</span>
                  <span className="text-[11px] font-medium text-slate-700 tabular-nums">
                    ₩{rates.find(r => r.currency === "EUR")?.rate.toLocaleString()}
                  </span>
                </div>
              )}
              {rates.find(r => r.currency === "CNY") && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">CNY</span>
                  <span className="text-[11px] font-medium text-slate-700 tabular-nums">
                    ₩{rates.find(r => r.currency === "CNY")?.rate.toLocaleString()}
                  </span>
                </div>
              )}
              {rates[0]?.baseDate && (
                <span className="text-[10px] text-slate-400 ml-0.5">
                  ({new Date(rates[0].baseDate).getMonth() + 1}/{new Date(rates[0].baseDate).getDate()})
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-slate-400">
              {ratesLoading ? "환율 로딩..." : "환율 정보 없음"}
            </span>
          )}
        </div>

        <NotificationBell userId={user?.id} />

        <div className="hidden sm:flex items-center bg-slate-100/80 rounded-full px-3 py-1.5 gap-2">
          <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
          <span className="text-[13px] text-slate-700 font-medium">
            {user?.name} {user?.level}
          </span>
        </div>

        <TokenInfo />
      </div>
    </header>
  );
}
