"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Globe,
  BarChart3,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";

interface SystemStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  companies: {
    total: number;
    newThisMonth: number;
    domestic: number;
    overseas: number;
  };
  documents: {
    total: number;
    pending: number;
    completed: number;
  };
  consultations: {
    total: number;
    thisMonth: number;
    followUp: number;
  };
  system: {
    uptime: string;
    lastBackup: string;
    dbSize: string;
    apiCalls: number;
  };
}

interface RecentActivity {
  id: string;
  type: "login" | "create" | "update" | "delete";
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  useEffect(() => {
    // 실제 데이터 로드 대신 샘플 데이터 사용
    const loadData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStats({
        users: {
          total: 25,
          active: 18,
          newThisMonth: 2,
        },
        companies: {
          total: 1250,
          newThisMonth: 45,
          domestic: 1100,
          overseas: 150,
        },
        documents: {
          total: 8500,
          pending: 120,
          completed: 8380,
        },
        consultations: {
          total: 15000,
          thisMonth: 450,
          followUp: 85,
        },
        system: {
          uptime: "99.9%",
          lastBackup: "2025-01-18 03:00",
          dbSize: "2.4 GB",
          apiCalls: 125000,
        },
      });

      setActivities([
        {
          id: "1",
          type: "login",
          user: "김영업",
          action: "로그인",
          target: "시스템",
          timestamp: "5분 전",
        },
        {
          id: "2",
          type: "create",
          user: "이기술",
          action: "거래처 등록",
          target: "(주)테스트기업",
          timestamp: "15분 전",
        },
        {
          id: "3",
          type: "update",
          user: "박관리",
          action: "견적서 수정",
          target: "EST-2025-001234",
          timestamp: "30분 전",
        },
        {
          id: "4",
          type: "delete",
          user: "최지원",
          action: "상담내역 삭제",
          target: "CONS-2025-005678",
          timestamp: "1시간 전",
        },
        {
          id: "5",
          type: "create",
          user: "김영업",
          action: "발주서 생성",
          target: "ORD-2025-002345",
          timestamp: "2시간 전",
        },
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading || !loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser.role !== "admin") {
    return null;
  }

  const statCards = [
    {
      title: "전체 사용자",
      value: stats?.users.total || 0,
      subtitle: `활성 ${stats?.users.active || 0}명`,
      icon: Users,
      color: "blue",
      trend: `+${stats?.users.newThisMonth || 0} 이번 달`,
    },
    {
      title: "거래처",
      value: stats?.companies.total || 0,
      subtitle: `국내 ${stats?.companies.domestic || 0} / 해외 ${stats?.companies.overseas || 0}`,
      icon: Building,
      color: "emerald",
      trend: `+${stats?.companies.newThisMonth || 0} 이번 달`,
    },
    {
      title: "문서",
      value: stats?.documents.total || 0,
      subtitle: `처리 대기 ${stats?.documents.pending || 0}건`,
      icon: FileText,
      color: "violet",
      trend: `완료율 ${stats ? Math.round((stats.documents.completed / stats.documents.total) * 100) : 0}%`,
    },
    {
      title: "상담내역",
      value: stats?.consultations.total || 0,
      subtitle: `후속상담 ${stats?.consultations.followUp || 0}건`,
      icon: Activity,
      color: "amber",
      trend: `+${stats?.consultations.thisMonth || 0} 이번 달`,
    },
  ];

  const systemCards = [
    {
      title: "시스템 가동률",
      value: stats?.system.uptime || "-",
      icon: Server,
      color: "emerald",
    },
    {
      title: "마지막 백업",
      value: stats?.system.lastBackup || "-",
      icon: Database,
      color: "blue",
    },
    {
      title: "DB 용량",
      value: stats?.system.dbSize || "-",
      icon: BarChart3,
      color: "violet",
    },
    {
      title: "API 호출 (월)",
      value: stats?.system.apiCalls?.toLocaleString() || "-",
      icon: Globe,
      color: "amber",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "create":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "update":
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case "delete":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        icon: "bg-blue-100",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        icon: "bg-emerald-100",
      },
      violet: {
        bg: "bg-violet-50",
        text: "text-violet-600",
        icon: "bg-violet-100",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        icon: "bg-amber-100",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              관리자 대시보드
            </h1>
            <p className="text-slate-500 mt-1">
              시스템 현황 및 주요 지표를 확인하세요
            </p>
          </div>
          <div className="text-sm text-slate-500">
            마지막 업데이트: {new Date().toLocaleString("ko-KR")}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const colors = getColorClasses(card.color);
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${colors.icon}`}>
                    <card.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </div>
                <div className={`mt-4 text-xs ${colors.text}`}>{card.trend}</div>
              </motion.div>
            );
          })}
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              시스템 상태
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {systemCards.map((card) => {
                const colors = getColorClasses(card.color);
                return (
                  <div
                    key={card.title}
                    className={`p-4 rounded-xl ${colors.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className={`w-4 h-4 ${colors.text}`} />
                      <span className="text-sm text-slate-600">{card.title}</span>
                    </div>
                    <p className={`text-lg font-semibold ${colors.text}`}>
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              최근 활동
            </h2>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{activity.user}</span>
                      {" - "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {activity.target}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            빠른 작업
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/admin/manage/users")}
              className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
            >
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-700">직원 관리</p>
            </button>
            <button
              onClick={() => router.push("/admin/announcements")}
              className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
            >
              <FileText className="w-6 h-6 text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-emerald-700">공지사항</p>
            </button>
            <button
              onClick={() => router.push("/admin/backup")}
              className="p-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group"
            >
              <Database className="w-6 h-6 text-violet-600 mb-2" />
              <p className="text-sm font-medium text-violet-700">백업 관리</p>
            </button>
            <button
              onClick={() => router.push("/admin/manage/logs")}
              className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
            >
              <Activity className="w-6 h-6 text-amber-600 mb-2" />
              <p className="text-sm font-medium text-amber-700">시스템 로그</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
