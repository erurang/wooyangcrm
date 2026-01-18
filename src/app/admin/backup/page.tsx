"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  HardDrive,
  Shield,
  Calendar,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface BackupItem {
  id: string;
  name: string;
  size: string;
  createdAt: string;
  type: "auto" | "manual";
  status: "completed" | "in_progress" | "failed";
}

export default function AdminBackupPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    // 샘플 백업 데이터 로드
    const loadBackups = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setBackups([
        {
          id: "1",
          name: "backup_2025-01-18_030000.sql.gz",
          size: "245 MB",
          createdAt: "2025-01-18 03:00:00",
          type: "auto",
          status: "completed",
        },
        {
          id: "2",
          name: "backup_2025-01-17_030000.sql.gz",
          size: "243 MB",
          createdAt: "2025-01-17 03:00:00",
          type: "auto",
          status: "completed",
        },
        {
          id: "3",
          name: "manual_backup_2025-01-16.sql.gz",
          size: "242 MB",
          createdAt: "2025-01-16 14:30:00",
          type: "manual",
          status: "completed",
        },
        {
          id: "4",
          name: "backup_2025-01-16_030000.sql.gz",
          size: "241 MB",
          createdAt: "2025-01-16 03:00:00",
          type: "auto",
          status: "completed",
        },
        {
          id: "5",
          name: "backup_2025-01-15_030000.sql.gz",
          size: "240 MB",
          createdAt: "2025-01-15 03:00:00",
          type: "auto",
          status: "completed",
        },
      ]);

      setIsLoading(false);
    };

    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    toast.info("백업을 생성하고 있습니다...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newBackup: BackupItem = {
      id: Date.now().toString(),
      name: `manual_backup_${new Date().toISOString().split("T")[0]}.sql.gz`,
      size: "245 MB",
      createdAt: new Date().toLocaleString("ko-KR"),
      type: "manual",
      status: "completed",
    };

    setBackups([newBackup, ...backups]);
    setIsCreating(false);
    toast.success("백업이 완료되었습니다.");
  };

  const handleRestore = async (backupId: string) => {
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) return;

    const confirm = window.confirm(
      `"${backup.name}" 백업으로 복원하시겠습니까?\n\n주의: 현재 데이터가 백업 시점의 데이터로 교체됩니다.`
    );

    if (!confirm) return;

    setIsRestoring(true);
    setSelectedBackup(backupId);
    toast.info("복원을 진행하고 있습니다...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setIsRestoring(false);
    setSelectedBackup(null);
    toast.success("복원이 완료되었습니다.");
  };

  const handleDownload = (backup: BackupItem) => {
    toast.info(`"${backup.name}" 다운로드를 시작합니다.`);
  };

  const handleDelete = async (backupId: string) => {
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) return;

    const confirm = window.confirm(
      `"${backup.name}" 백업을 삭제하시겠습니까?`
    );

    if (!confirm) return;

    setBackups(backups.filter((b) => b.id !== backupId));
    toast.success("백업이 삭제되었습니다.");
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
            <div className="p-3 bg-violet-100 rounded-xl">
              <Database className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">백업 / 복원</h1>
              <p className="text-slate-500">데이터베이스 백업 및 복원 관리</p>
            </div>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
            새 백업 생성
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-slate-500">마지막 백업</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">
              {backups[0]?.createdAt || "-"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {backups[0]?.type === "auto" ? "자동 백업" : "수동 백업"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-slate-500">총 백업 수</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">
              {backups.length}개
            </p>
            <p className="text-sm text-slate-500 mt-1">
              자동 {backups.filter((b) => b.type === "auto").length}개 / 수동{" "}
              {backups.filter((b) => b.type === "manual").length}개
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-slate-500">보관 기간</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">30일</p>
            <p className="text-sm text-slate-500 mt-1">자동 삭제 활성화</p>
          </motion.div>
        </div>

        {/* Backup List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">백업 목록</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className={`p-4 flex items-center justify-between hover:bg-slate-50 ${
                  selectedBackup === backup.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      backup.type === "auto" ? "bg-blue-100" : "bg-violet-100"
                    }`}
                  >
                    {backup.type === "auto" ? (
                      <Clock
                        className={`w-5 h-5 ${
                          backup.type === "auto"
                            ? "text-blue-600"
                            : "text-violet-600"
                        }`}
                      />
                    ) : (
                      <HardDrive className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{backup.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500">
                        {backup.size}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {backup.createdAt}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          backup.type === "auto"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {backup.type === "auto" ? "자동" : "수동"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(backup)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRestore(backup.id)}
                    disabled={isRestoring}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                    title="복원"
                  >
                    {isRestoring && selectedBackup === backup.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(backup.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
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
              <p className="font-medium text-amber-800">복원 시 주의사항</p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>복원 시 현재 데이터가 백업 시점의 데이터로 완전히 교체됩니다.</li>
                <li>복원 작업 중에는 시스템 접근이 제한될 수 있습니다.</li>
                <li>복원 전 현재 상태의 백업을 먼저 생성하는 것을 권장합니다.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
