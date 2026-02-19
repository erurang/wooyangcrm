"use client";

import { motion } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react";
import type { TrackingEvent, TrackingResult } from "@/lib/carriers";
import { getStatusText, getStatusColor } from "@/lib/carriers";

interface ShippingTimelineProps {
  timeline: TrackingEvent[];
  status: TrackingResult["status"];
}

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  exception: AlertCircle,
  unknown: Clock,
};

export default function ShippingTimeline({
  timeline,
  status,
}: ShippingTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Package size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">배송 이력이 없습니다.</p>
      </div>
    );
  }

  // 시간순 정렬 (과거 → 최신)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative">
      {/* 전체 상태 */}
      <div
        className={`mb-4 px-3 py-2 rounded-lg ${getStatusColor(status)} flex items-center gap-2`}
      >
        {(() => {
          const Icon = statusIcons[status] || Clock;
          return <Icon size={18} />;
        })()}
        <span className="font-medium">{getStatusText(status)}</span>
      </div>

      {/* 타임라인 */}
      <div className="relative pl-6">
        {/* 세로 선 */}
        <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200" />

        {sortedTimeline.map((event, index, arr) => {
          const isLatest = index === arr.length - 1;
          const isDelivered = event.status === "delivered";
          const Icon = statusIcons[event.status] || MapPin;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pb-4 last:pb-0"
            >
              {/* 아이콘 */}
              <div
                className={`absolute -left-4 w-5 h-5 rounded-full flex items-center justify-center ${
                  isLatest
                    ? isDelivered
                      ? "bg-green-500 text-white"
                      : "bg-sky-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                <Icon size={12} />
              </div>

              {/* 내용 */}
              <div
                className={`ml-4 ${isLatest ? "font-medium" : "text-slate-500"}`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">
                    {formatDate(event.date)}
                  </span>
                  {event.location && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin size={12} />
                      {event.location}
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 ${isLatest ? "text-slate-800" : "text-slate-600"}`}>
                  {event.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}
