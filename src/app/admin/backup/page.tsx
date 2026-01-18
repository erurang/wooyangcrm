"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Info,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";

export default function AdminBackupPage() {
  const loginUser = useLoginUser();
  const router = useRouter();

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  if (!loginUser) {
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

  const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '');
  const projectRef = supabaseProjectUrl?.split('//')[1]?.split('.')[0] || '';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Database className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">백업 / 복원</h1>
            <p className="text-slate-500">데이터베이스 백업 및 복원 관리</p>
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-xl p-5 border border-blue-200"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Supabase 백업 시스템</p>
              <p className="text-sm text-blue-700 mt-1">
                데이터베이스 백업은 Supabase에서 자동으로 관리됩니다.
                백업 확인 및 복원은 Supabase 대시보드에서 진행해주세요.
              </p>
            </div>
          </div>
        </motion.div>

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
              <span className="text-slate-500">자동 백업</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">활성화됨</p>
            <p className="text-sm text-slate-500 mt-1">매일 자동 백업</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-slate-500">보관 기간</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">7일</p>
            <p className="text-sm text-slate-500 mt-1">Pro 플랜: 30일</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Shield className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-slate-500">Point-in-Time Recovery</span>
            </div>
            <p className="text-lg font-semibold text-slate-800">Pro 플랜</p>
            <p className="text-sm text-slate-500 mt-1">특정 시점 복원 가능</p>
          </motion.div>
        </div>

        {/* Supabase Dashboard Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <HardDrive className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Supabase 대시보드</h2>
                <p className="text-sm text-slate-500">백업 관리, 복원, 데이터베이스 설정</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`https://supabase.com/dashboard/project/${projectRef}/settings/database`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 transition-colors group"
              >
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-violet-600">데이터베이스 설정</p>
                  <p className="text-sm text-slate-500">연결 정보, 풀링, SSL 설정</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-violet-500" />
              </a>

              <a
                href={`https://supabase.com/dashboard/project/${projectRef}/database/backups`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 transition-colors group"
              >
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-violet-600">백업 관리</p>
                  <p className="text-sm text-slate-500">백업 목록 확인 및 복원</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-violet-500" />
              </a>

              <a
                href={`https://supabase.com/dashboard/project/${projectRef}/editor`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 transition-colors group"
              >
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-violet-600">테이블 에디터</p>
                  <p className="text-sm text-slate-500">데이터 직접 조회 및 수정</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-violet-500" />
              </a>

              <a
                href={`https://supabase.com/dashboard/project/${projectRef}/sql`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 transition-colors group"
              >
                <div>
                  <p className="font-medium text-slate-800 group-hover:text-violet-600">SQL 에디터</p>
                  <p className="text-sm text-slate-500">SQL 쿼리 직접 실행</p>
                </div>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-violet-500" />
              </a>
            </div>
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
              <p className="font-medium text-amber-800">백업 관련 안내</p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                <li>Supabase Free 플랜: 매일 자동 백업, 7일간 보관</li>
                <li>Supabase Pro 플랜: Point-in-Time Recovery, 30일간 보관</li>
                <li>복원 작업은 Supabase 대시보드에서만 가능합니다</li>
                <li>중요 데이터는 별도로 CSV 내보내기를 권장합니다</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
