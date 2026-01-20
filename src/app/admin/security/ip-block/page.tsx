"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Plus,
  X,
  AlertTriangle,
  Globe,
  Clock,
  Ban,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string | null;
  blockedBy: string;
  attemptCount: number;
}

export default function IPBlockPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIP, setNewIP] = useState({
    ip: "",
    reason: "",
    expiresIn: "permanent",
  });

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    const loadBlockedIPs = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setBlockedIPs([
        {
          id: "1",
          ip: "203.0.113.50",
          reason: "반복적인 로그인 실패 (10회 이상)",
          blockedAt: "2025-01-18 14:30:00",
          expiresAt: "2025-01-19 14:30:00",
          blockedBy: "시스템 자동",
          attemptCount: 15,
        },
        {
          id: "2",
          ip: "185.199.110.1",
          reason: "자동화 봇 의심",
          blockedAt: "2025-01-17 10:00:00",
          expiresAt: null,
          blockedBy: "관리자",
          attemptCount: 230,
        },
        {
          id: "3",
          ip: "192.0.2.100",
          reason: "비정상적인 접근 패턴",
          blockedAt: "2025-01-16 08:15:00",
          expiresAt: "2025-01-23 08:15:00",
          blockedBy: "관리자",
          attemptCount: 45,
        },
        {
          id: "4",
          ip: "198.51.100.25",
          reason: "SQL Injection 시도",
          blockedAt: "2025-01-15 22:45:00",
          expiresAt: null,
          blockedBy: "시스템 자동",
          attemptCount: 8,
        },
      ]);

      setIsLoading(false);
    };

    loadBlockedIPs();
  }, []);

  const handleAddIP = () => {
    if (!newIP.ip) {
      toast.error("IP 주소를 입력하세요.");
      return;
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIP.ip)) {
      toast.error("올바른 IP 주소 형식이 아닙니다.");
      return;
    }

    const now = new Date();
    let expiresAt: string | null = null;
    if (newIP.expiresIn !== "permanent") {
      const hours = parseInt(newIP.expiresIn);
      const expires = new Date(now.getTime() + hours * 60 * 60 * 1000);
      expiresAt = expires.toISOString().slice(0, 19).replace("T", " ");
    }

    const newBlockedIP: BlockedIP = {
      id: Date.now().toString(),
      ip: newIP.ip,
      reason: newIP.reason || "수동 차단",
      blockedAt: now.toISOString().slice(0, 19).replace("T", " "),
      expiresAt,
      blockedBy: loginUser?.name || "관리자",
      attemptCount: 0,
    };

    setBlockedIPs([newBlockedIP, ...blockedIPs]);
    setShowAddModal(false);
    setNewIP({ ip: "", reason: "", expiresIn: "permanent" });
    toast.success("IP가 차단되었습니다.");
  };

  const handleRemoveIP = (id: string) => {
    const ip = blockedIPs.find((b) => b.id === id);
    if (!ip) return;

    const confirm = window.confirm(`"${ip.ip}" 차단을 해제하시겠습니까?`);
    if (!confirm) return;

    setBlockedIPs(blockedIPs.filter((b) => b.id !== id));
    toast.success("차단이 해제되었습니다.");
  };

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">IP 차단</h1>
              <p className="text-slate-500">의심스러운 IP 주소 차단 관리</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            IP 차단 추가
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-5 h-5 text-red-500" />
              <span className="text-slate-500">총 차단</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {blockedIPs.length}개
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-slate-500">영구 차단</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {blockedIPs.filter((b) => !b.expiresAt).length}개
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-slate-500">임시 차단</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {blockedIPs.filter((b) => b.expiresAt).length}개
            </p>
          </motion.div>
        </div>

        {/* Blocked IPs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">차단된 IP 목록</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {blockedIPs.map((ip) => (
              <div
                key={ip.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Globe className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium text-slate-800">
                        {ip.ip}
                      </p>
                      {ip.expiresAt ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          임시 차단
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          영구 차단
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{ip.reason}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>차단: {ip.blockedAt}</span>
                      {ip.expiresAt && <span>만료: {ip.expiresAt}</span>}
                      <span>by {ip.blockedBy}</span>
                      <span>시도 횟수: {ip.attemptCount}회</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveIP(ip.id)}
                  className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="차단 해제"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            {blockedIPs.length === 0 && (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">차단된 IP가 없습니다</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-amber-50 rounded-xl p-4 border border-amber-200"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">IP 차단 시 주의사항</p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>
                  IP 범위(CIDR)를 사용할 수 있습니다. (예: 192.168.1.0/24)
                </li>
                <li>
                  공유 IP 환경에서는 여러 사용자가 영향을 받을 수 있습니다.
                </li>
                <li>
                  영구 차단된 IP는 수동으로만 해제할 수 있습니다.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md m-4 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              IP 차단 추가
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  IP 주소 *
                </label>
                <input
                  type="text"
                  value={newIP.ip}
                  onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                  placeholder="예: 192.168.1.100 또는 192.168.1.0/24"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  차단 사유
                </label>
                <input
                  type="text"
                  value={newIP.reason}
                  onChange={(e) => setNewIP({ ...newIP, reason: e.target.value })}
                  placeholder="차단 사유 입력"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  차단 기간
                </label>
                <select
                  value={newIP.expiresIn}
                  onChange={(e) =>
                    setNewIP({ ...newIP, expiresIn: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="1">1시간</option>
                  <option value="6">6시간</option>
                  <option value="24">24시간</option>
                  <option value="168">1주일</option>
                  <option value="720">30일</option>
                  <option value="permanent">영구</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddIP}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                차단
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
