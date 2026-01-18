"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Save,
  RefreshCw,
  Mail,
  Bell,
  Clock,
  Shield,
  Database,
  Globe,
  Palette,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  notification: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    reminderDays: number;
    digestFrequency: "daily" | "weekly" | "never";
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: "daily" | "weekly" | "monthly";
    retentionDays: number;
  };
}

export default function AdminSettingsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: "WOOYANG CRM",
      siteDescription: "우양신소재 CRM 시스템",
      maintenanceMode: false,
      allowRegistration: false,
    },
    notification: {
      emailEnabled: true,
      pushEnabled: true,
      reminderDays: 3,
      digestFrequency: "daily",
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
    },
    backup: {
      autoBackup: true,
      backupFrequency: "daily",
      retentionDays: 30,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "notification" | "security" | "backup">("general");

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("설정이 저장되었습니다.");
    setIsSaving(false);
  };

  const handleReset = () => {
    toast.info("설정이 초기화되었습니다.");
  };

  if (!loginUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loginUser.role !== "admin") {
    return null;
  }

  const tabs = [
    { id: "general", label: "일반", icon: Globe },
    { id: "notification", label: "알림", icon: Bell },
    { id: "security", label: "보안", icon: Shield },
    { id: "backup", label: "백업", icon: Database },
  ];

  const Toggle = ({
    enabled,
    onChange,
    label,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
  }) => (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2"
    >
      {enabled ? (
        <ToggleRight className="w-8 h-8 text-blue-500" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-400" />
      )}
      <span className={enabled ? "text-blue-600" : "text-slate-500"}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">시스템 설정</h1>
              <p className="text-slate-500">시스템 환경을 설정합니다</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              초기화
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              저장
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-600"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
        >
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  사이트 이름
                </label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, siteName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  사이트 설명
                </label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: {
                        ...settings.general,
                        siteDescription: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <p className="font-medium text-amber-800">유지보수 모드</p>
                  <p className="text-sm text-amber-600">
                    활성화 시 관리자 외 접근 차단
                  </p>
                </div>
                <Toggle
                  enabled={settings.general.maintenanceMode}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, maintenanceMode: value },
                    })
                  }
                  label={settings.general.maintenanceMode ? "활성" : "비활성"}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">회원가입 허용</p>
                  <p className="text-sm text-slate-500">
                    새 사용자의 자체 가입 허용
                  </p>
                </div>
                <Toggle
                  enabled={settings.general.allowRegistration}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, allowRegistration: value },
                    })
                  }
                  label={settings.general.allowRegistration ? "허용" : "차단"}
                />
              </div>
            </div>
          )}

          {activeTab === "notification" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">이메일 알림</p>
                    <p className="text-sm text-slate-500">
                      중요 알림을 이메일로 발송
                    </p>
                  </div>
                </div>
                <Toggle
                  enabled={settings.notification.emailEnabled}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        emailEnabled: value,
                      },
                    })
                  }
                  label={settings.notification.emailEnabled ? "활성" : "비활성"}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">푸시 알림</p>
                    <p className="text-sm text-slate-500">
                      브라우저 푸시 알림 사용
                    </p>
                  </div>
                </div>
                <Toggle
                  enabled={settings.notification.pushEnabled}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        pushEnabled: value,
                      },
                    })
                  }
                  label={settings.notification.pushEnabled ? "활성" : "비활성"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  리마인더 알림 (일 전)
                </label>
                <input
                  type="number"
                  value={settings.notification.reminderDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        reminderDays: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={1}
                  max={30}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  요약 알림 주기
                </label>
                <select
                  value={settings.notification.digestFrequency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notification: {
                        ...settings.notification,
                        digestFrequency: e.target.value as "daily" | "weekly" | "never",
                      },
                    })
                  }
                  className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="never">사용 안함</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  세션 타임아웃 (분)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeout: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={5}
                  max={480}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  비활동 시 자동 로그아웃 시간
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  최대 로그인 시도 횟수
                </label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        maxLoginAttempts: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={3}
                  max={10}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  초과 시 계정 임시 잠금
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  최소 비밀번호 길이
                </label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        passwordMinLength: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={6}
                  max={20}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">2단계 인증 필수</p>
                  <p className="text-sm text-slate-500">
                    모든 사용자에게 2FA 요구
                  </p>
                </div>
                <Toggle
                  enabled={settings.security.requireTwoFactor}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, requireTwoFactor: value },
                    })
                  }
                  label={settings.security.requireTwoFactor ? "필수" : "선택"}
                />
              </div>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">자동 백업</p>
                  <p className="text-sm text-slate-500">
                    정기적으로 데이터 자동 백업
                  </p>
                </div>
                <Toggle
                  enabled={settings.backup.autoBackup}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      backup: { ...settings.backup, autoBackup: value },
                    })
                  }
                  label={settings.backup.autoBackup ? "활성" : "비활성"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  백업 주기
                </label>
                <select
                  value={settings.backup.backupFrequency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        backupFrequency: e.target.value as "daily" | "weekly" | "monthly",
                      },
                    })
                  }
                  className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!settings.backup.autoBackup}
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  백업 보관 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.backup.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        retentionDays: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={7}
                  max={365}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  이 기간 이후 자동 삭제
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">백업 안내</p>
                    <p className="text-sm text-blue-600 mt-1">
                      수동 백업은 &quot;백업/복원&quot; 메뉴에서 실행할 수 있습니다.
                      백업 파일은 보안을 위해 암호화되어 저장됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
