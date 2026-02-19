"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Megaphone,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useAnnouncements, type Announcement } from "@/hooks/useAnnouncements";
import { useLoginUser } from "@/context/login";

const priorityLabels = {
  urgent: { label: "긴급", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  high: { label: "높음", color: "bg-orange-100 text-orange-700 border-orange-200", icon: ArrowUp },
  normal: { label: "보통", color: "bg-sky-100 text-sky-700 border-sky-200", icon: Minus },
  low: { label: "낮음", color: "bg-slate-100 text-slate-600 border-slate-200", icon: ArrowDown },
};

export default function AnnouncementModal() {
  const loginUser = useLoginUser();
  const { unreadAnnouncements, markAsRead, markAllAsRead, isLoading } = useAnnouncements(loginUser?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // 로그인 후 읽지 않은 공지사항이 있으면 모달 표시
  useEffect(() => {
    if (!hasCheckedSession && !isLoading && loginUser?.id) {
      // 이번 세션에서 이미 공지사항을 봤는지 확인
      const sessionKey = `announcements_shown_${loginUser.id}`;
      const hasShown = sessionStorage.getItem(sessionKey);

      if (!hasShown && unreadAnnouncements.length > 0) {
        setIsOpen(true);
        sessionStorage.setItem(sessionKey, "true");
      }
      setHasCheckedSession(true);
    }
  }, [hasCheckedSession, isLoading, loginUser?.id, unreadAnnouncements.length]);

  const handleClose = async () => {
    // 현재 공지사항 읽음 처리
    if (unreadAnnouncements[currentIndex]) {
      await markAsRead(unreadAnnouncements[currentIndex].id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAndClose = async () => {
    await markAllAsRead();
    setIsOpen(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = async () => {
    // 현재 공지사항 읽음 처리
    if (unreadAnnouncements[currentIndex]) {
      await markAsRead(unreadAnnouncements[currentIndex].id);
    }

    if (currentIndex < unreadAnnouncements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  if (!isOpen || unreadAnnouncements.length === 0) return null;

  const currentAnnouncement = unreadAnnouncements[currentIndex];
  const priorityInfo = priorityLabels[currentAnnouncement.priority];
  const PriorityIcon = priorityInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {/* Priority Indicator Bar */}
          <div className={`h-1.5 ${
            currentAnnouncement.priority === "urgent" ? "bg-red-500" :
            currentAnnouncement.priority === "high" ? "bg-orange-500" :
            currentAnnouncement.priority === "normal" ? "bg-sky-500" : "bg-slate-400"
          }`} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">공지사항</h2>
                <p className="text-xs text-slate-500">
                  {currentIndex + 1} / {unreadAnnouncements.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${priorityInfo.color} mb-3`}>
              <PriorityIcon className="h-3.5 w-3.5" />
              {priorityInfo.label}
            </span>

            {/* Title */}
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              {currentAnnouncement.title}
            </h3>

            {/* Content */}
            <div className="text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {currentAnnouncement.content}
            </div>

            {/* Date */}
            <p className="mt-4 text-xs text-slate-400">
              {new Date(currentAnnouncement.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <button
              onClick={handleMarkAllAndClose}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              모두 읽음 처리
            </button>

            <div className="flex items-center gap-2">
              {unreadAnnouncements.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Dots indicator */}
                  <div className="flex items-center gap-1.5">
                    {unreadAnnouncements.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentIndex ? "bg-purple-600" : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNext}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                onClick={goToNext}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {currentIndex === unreadAnnouncements.length - 1 ? "확인" : "다음"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
