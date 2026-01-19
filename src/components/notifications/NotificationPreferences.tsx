"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, Check, FileText, MessageSquare, Package, ClipboardList, Users, ListTodo, Bell } from "lucide-react";
import useSWR from "swr";

interface NotificationCategory {
  label: string;
  types: string[];
  description: string;
}

interface NotificationPreferencesProps {
  userId?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  documents: <FileText className="w-5 h-5" />,
  board: <MessageSquare className="w-5 h-5" />,
  inventory: <Package className="w-5 h-5" />,
  workOrders: <ClipboardList className="w-5 h-5" />,
  consultations: <Users className="w-5 h-5" />,
  todos: <ListTodo className="w-5 h-5" />,
  system: <Bell className="w-5 h-5" />,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  documents: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  board: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  inventory: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  workOrders: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  consultations: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  todos: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  system: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, error, isLoading } = useSWR<{
    settings: Record<string, boolean>;
    categories: Record<string, NotificationCategory>;
  }>(
    userId ? `/api/notifications/settings?userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // 데이터 로드 시 설정 초기화
  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data]);

  // 설정 토글
  const toggleCategory = async (category: string) => {
    const newSettings = {
      ...settings,
      [category]: !settings[category],
    };
    setSettings(newSettings);

    // 자동 저장
    setIsSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          settings: newSettings,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("설정 저장 실패:", err);
      // 롤백
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center py-8 text-slate-500">
          알림 설정을 불러오는 데 실패했습니다.
        </div>
      </div>
    );
  }

  const categories = data?.categories || {};

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">알림 설정</h3>
            <p className="text-sm text-slate-500">받을 알림 종류를 선택하세요</p>
          </div>
        </div>
        {(isSaving || saveSuccess) && (
          <div className="flex items-center gap-1.5 text-sm">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-slate-400">저장 중...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">저장됨</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {Object.entries(categories).map(([key, category]) => {
          const isEnabled = settings[key] !== false; // 기본값 true
          const colors = categoryColors[key] || categoryColors.system;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isEnabled
                  ? `${colors.bg} ${colors.border}`
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isEnabled ? colors.bg : "bg-slate-100"
                  }`}
                >
                  <span className={isEnabled ? colors.text : "text-slate-400"}>
                    {categoryIcons[key]}
                  </span>
                </div>
                <div>
                  <div
                    className={`font-medium text-sm ${
                      isEnabled ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {category.label}
                  </div>
                  <div className="text-xs text-slate-400">
                    {category.description}
                  </div>
                </div>
              </div>

              {/* 토글 스위치 */}
              <button
                onClick={() => toggleCategory(key)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isEnabled ? "bg-indigo-600" : "bg-slate-300"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-400 text-center">
        알림을 끄면 해당 유형의 알림을 받지 않습니다.
      </p>
    </div>
  );
}
