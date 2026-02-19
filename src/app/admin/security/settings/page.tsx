"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Save,
  RefreshCw,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useRouter } from "next/navigation";
import { useGlobalToast } from "@/context/toast";

interface SecuritySettings {
  authentication: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requirePasswordChange: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
  };
  twoFactor: {
    enabled: boolean;
    enforceForAdmin: boolean;
    allowedMethods: string[];
  };
  ipSecurity: {
    enableWhitelist: boolean;
    whitelist: string[];
    autoBlockThreshold: number;
    blockDuration: number;
  };
  logging: {
    logAllAccess: boolean;
    logApiCalls: boolean;
    retentionDays: number;
    alertOnSuspicious: boolean;
  };
}

export default function SecuritySettingsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const toast = useGlobalToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    authentication: {
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      sessionTimeout: 60,
      requirePasswordChange: 90,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
    },
    twoFactor: {
      enabled: false,
      enforceForAdmin: true,
      allowedMethods: ["email", "authenticator"],
    },
    ipSecurity: {
      enableWhitelist: false,
      whitelist: [],
      autoBlockThreshold: 10,
      blockDuration: 24,
    },
    logging: {
      logAllAccess: true,
      logApiCalls: true,
      retentionDays: 90,
      alertOnSuspicious: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "authentication" | "twoFactor" | "ipSecurity" | "logging"
  >("authentication");

  useEffect(() => {
    if (loginUser && loginUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loginUser, router]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("보안 설정이 저장되었습니다.");
    setIsSaving(false);
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

  if (loginUser?.role !== "admin") {
    return null;
  }

  const tabs = [
    { id: "authentication", label: "인증", icon: Lock },
    { id: "twoFactor", label: "2단계 인증", icon: Key },
    { id: "ipSecurity", label: "IP 보안", icon: Shield },
    { id: "logging", label: "로깅", icon: Eye },
  ];

  const Toggle = ({
    enabled,
    onChange,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <button onClick={() => onChange(!enabled)} className="flex items-center">
      {enabled ? (
        <ToggleRight className="w-8 h-8 text-sky-500" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">보안 설정</h1>
              <p className="text-slate-500">시스템 보안 정책을 설정합니다</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            저장
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-100 text-emerald-600"
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
          {activeTab === "authentication" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    최대 로그인 시도 횟수
                  </label>
                  <input
                    type="number"
                    value={settings.authentication.maxLoginAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        authentication: {
                          ...settings.authentication,
                          maxLoginAttempts: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    min={3}
                    max={10}
                    className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    초과 시 계정 임시 잠금
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    계정 잠금 시간 (분)
                  </label>
                  <input
                    type="number"
                    value={settings.authentication.lockoutDuration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        authentication: {
                          ...settings.authentication,
                          lockoutDuration: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    min={5}
                    max={120}
                    className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    세션 타임아웃 (분)
                  </label>
                  <input
                    type="number"
                    value={settings.authentication.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        authentication: {
                          ...settings.authentication,
                          sessionTimeout: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    min={5}
                    max={480}
                    className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    비밀번호 변경 주기 (일)
                  </label>
                  <input
                    type="number"
                    value={settings.authentication.requirePasswordChange}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        authentication: {
                          ...settings.authentication,
                          requirePasswordChange: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    min={30}
                    max={365}
                    className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-medium text-slate-800 mb-4">
                  비밀번호 정책
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      최소 비밀번호 길이
                    </label>
                    <input
                      type="number"
                      value={settings.authentication.passwordMinLength}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          authentication: {
                            ...settings.authentication,
                            passwordMinLength: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      min={6}
                      max={20}
                      className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">대문자 필수</p>
                      <p className="text-sm text-slate-500">
                        비밀번호에 대문자 포함 필수
                      </p>
                    </div>
                    <Toggle
                      enabled={settings.authentication.passwordRequireUppercase}
                      onChange={(value) =>
                        setSettings({
                          ...settings,
                          authentication: {
                            ...settings.authentication,
                            passwordRequireUppercase: value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">숫자 필수</p>
                      <p className="text-sm text-slate-500">
                        비밀번호에 숫자 포함 필수
                      </p>
                    </div>
                    <Toggle
                      enabled={settings.authentication.passwordRequireNumbers}
                      onChange={(value) =>
                        setSettings({
                          ...settings,
                          authentication: {
                            ...settings.authentication,
                            passwordRequireNumbers: value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">특수문자 필수</p>
                      <p className="text-sm text-slate-500">
                        비밀번호에 특수문자 포함 필수
                      </p>
                    </div>
                    <Toggle
                      enabled={settings.authentication.passwordRequireSymbols}
                      onChange={(value) =>
                        setSettings({
                          ...settings,
                          authentication: {
                            ...settings.authentication,
                            passwordRequireSymbols: value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "twoFactor" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">2단계 인증 활성화</p>
                  <p className="text-sm text-slate-500">
                    사용자가 2단계 인증을 사용할 수 있게 합니다
                  </p>
                </div>
                <Toggle
                  enabled={settings.twoFactor.enabled}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      twoFactor: { ...settings.twoFactor, enabled: value },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <p className="font-medium text-amber-800">
                    관리자 2단계 인증 필수
                  </p>
                  <p className="text-sm text-amber-600">
                    관리자 역할의 사용자는 반드시 2FA 사용
                  </p>
                </div>
                <Toggle
                  enabled={settings.twoFactor.enforceForAdmin}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      twoFactor: { ...settings.twoFactor, enforceForAdmin: value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  허용된 인증 방법
                </label>
                <div className="space-y-2">
                  {["email", "authenticator", "sms"].map((method) => {
                    const labels: Record<string, string> = {
                      email: "이메일 인증",
                      authenticator: "인증 앱 (Google Authenticator 등)",
                      sms: "SMS 인증",
                    };
                    return (
                      <label
                        key={method}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                      >
                        <input
                          type="checkbox"
                          checked={settings.twoFactor.allowedMethods.includes(
                            method
                          )}
                          onChange={(e) => {
                            const methods = e.target.checked
                              ? [...settings.twoFactor.allowedMethods, method]
                              : settings.twoFactor.allowedMethods.filter(
                                  (m) => m !== method
                                );
                            setSettings({
                              ...settings,
                              twoFactor: {
                                ...settings.twoFactor,
                                allowedMethods: methods,
                              },
                            });
                          }}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                        />
                        <span className="text-slate-700">{labels[method]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "ipSecurity" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">
                    IP 화이트리스트 활성화
                  </p>
                  <p className="text-sm text-slate-500">
                    지정된 IP만 접근 허용 (주의: 설정 오류 시 접근 불가)
                  </p>
                </div>
                <Toggle
                  enabled={settings.ipSecurity.enableWhitelist}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      ipSecurity: {
                        ...settings.ipSecurity,
                        enableWhitelist: value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  자동 차단 임계값 (실패 횟수)
                </label>
                <input
                  type="number"
                  value={settings.ipSecurity.autoBlockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ipSecurity: {
                        ...settings.ipSecurity,
                        autoBlockThreshold: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={5}
                  max={50}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  이 횟수 이상 로그인 실패 시 IP 자동 차단
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  자동 차단 기간 (시간)
                </label>
                <input
                  type="number"
                  value={settings.ipSecurity.blockDuration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ipSecurity: {
                        ...settings.ipSecurity,
                        blockDuration: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={1}
                  max={720}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === "logging" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">모든 접근 기록</p>
                  <p className="text-sm text-slate-500">
                    로그인/로그아웃 등 모든 인증 활동 기록
                  </p>
                </div>
                <Toggle
                  enabled={settings.logging.logAllAccess}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      logging: { ...settings.logging, logAllAccess: value },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800">API 호출 기록</p>
                  <p className="text-sm text-slate-500">
                    모든 API 요청/응답 로깅
                  </p>
                </div>
                <Toggle
                  enabled={settings.logging.logApiCalls}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      logging: { ...settings.logging, logApiCalls: value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  로그 보관 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.logging.retentionDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      logging: {
                        ...settings.logging,
                        retentionDays: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min={30}
                  max={365}
                  className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div>
                  <p className="font-medium text-amber-800">의심 활동 알림</p>
                  <p className="text-sm text-amber-600">
                    비정상적인 접근 패턴 감지 시 관리자 알림
                  </p>
                </div>
                <Toggle
                  enabled={settings.logging.alertOnSuspicious}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      logging: { ...settings.logging, alertOnSuspicious: value },
                    })
                  }
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-sky-50 rounded-xl p-4 border border-sky-200"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-500 mt-0.5" />
            <div>
              <p className="font-medium text-sky-800">보안 설정 안내</p>
              <p className="text-sm text-sky-600 mt-1">
                보안 설정 변경 시 기존 세션에는 즉시 적용되지 않을 수 있습니다.
                중요한 설정 변경 후에는 모든 세션을 로그아웃하고 다시 로그인하는 것을 권장합니다.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
