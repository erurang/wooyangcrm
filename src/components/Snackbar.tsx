"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface SnackbarProps {
  message: string | null;
  severity?: "success" | "error" | "warning" | "info";
  onClose: () => void;
}

const severityConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    bg: "bg-sky-50 border-sky-200",
    text: "text-sky-800",
    iconColor: "text-sky-500",
  },
};

export default function SnackbarComponent({
  message,
  severity = "info",
  onClose,
}: SnackbarProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed bottom-6 right-6 z-[9999]"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${config.bg}`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
            <span className={`text-sm font-medium ${config.text}`}>{message}</span>
            <button
              onClick={onClose}
              className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
