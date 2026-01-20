// context/login.ts
"use client";
import { createSupabaseClient } from "@/utils/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";

interface TeamInfo {
  id: string;
  name: string;
  allowed_menus: string[];
  department?: {
    id: string;
    name: string;
  };
}

interface LoginUser {
  email: string;
  role: string;
  role_id?: number;  // 옵셔널로 변경 (이전 로그인 로직 호환)
  name: string;
  id: string;
  level: string;
  position: string;
  worksEmail: string;
  team_id?: string;
  team?: TeamInfo;
  sidebarPermissions?: string[]; // 허용된 사이드바 메뉴 ID 배열
}

// Supabase 쿼리 결과 타입 (Supabase는 조인 결과를 배열로 반환할 수 있음)
interface UserQueryResult {
  name: string;
  id: string;
  position: string | null;
  level: string | null;
  works_email: string | null;
  team_id: string | null;
  role_id: number | null;
  roles: { id: number; role_name: string } | { id: number; role_name: string }[] | null;
  team: {
    id: string;
    name: string;
    allowed_menus: string[];
    department: {
      id: string;
      name: string;
    } | { id: string; name: string }[] | null;
  } | {
    id: string;
    name: string;
    allowed_menus: string[];
    department: {
      id: string;
      name: string;
    } | { id: string; name: string }[] | null;
  }[] | null;
}

// Context에 저장할 값 (loginUser + setLoginUser)
interface LoginUserContextValue {
  loginUser: LoginUser | undefined;
  setLoginUser: React.Dispatch<React.SetStateAction<LoginUser | undefined>>;
}

// 초기값을 null로 하고, 나중에 Provider에서 채워줌
const LoginUserContext = createContext<LoginUserContextValue | null>(null);

// Provider...
export function LoginUserProvider({ children }: { children: React.ReactNode }) {
  const [loginUser, setLoginUser] = useState<LoginUser | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error("❌ 세션을 가져올 수 없음:", error);
          return;
        }

        // ✅ Supabase users 테이블에서 추가 정보 가져오기 (팀 정보 포함)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(`
            name, id, position, level, role_id, roles(id, role_name), works_email, team_id,
            team:teams (
              id,
              name,
              allowed_menus,
              department:departments (
                id,
                name
              )
            )
          `)
          .eq("email", data.session.user.email)
          .single();

        if (userError || !userData) {
          console.error("❌ 사용자 정보 조회 실패:", userError);
          return;
        }

        const typedUserData = userData as UserQueryResult;
        const roles = typedUserData.roles;
        const roleName = Array.isArray(roles) ? roles[0]?.role_name : roles?.role_name;
        const roleId = typedUserData.role_id || (Array.isArray(roles) ? roles[0]?.id : roles?.id);

        // team이 배열인 경우 첫 번째 요소 사용 (FK 관계는 단일 객체 또는 배열로 반환될 수 있음)
        const teamData = Array.isArray(typedUserData.team) ? typedUserData.team[0] : typedUserData.team;
        const deptData = teamData?.department
          ? (Array.isArray(teamData.department) ? teamData.department[0] : teamData.department)
          : undefined;

        // ✅ 역할 기반 사이드바 권한 조회
        let sidebarPermissions: string[] = [];
        if (roleId) {
          const { data: permData } = await supabase
            .from("role_permissions")
            .select("permission_key, is_enabled")
            .eq("role_id", roleId)
            .like("permission_key", "sidebar.%");

          if (permData) {
            sidebarPermissions = permData
              .filter((p) => p.is_enabled)
              .map((p) => p.permission_key.replace("sidebar.", ""));
          }
        }

        setLoginUser({
          email: data.session.user.email || "",
          role: roleName || "user",
          role_id: roleId || 0,
          name: typedUserData.name,
          id: typedUserData.id,
          position: typedUserData.position || "",
          level: typedUserData.level || "",
          worksEmail: typedUserData.works_email || "",
          team_id: typedUserData.team_id || undefined,
          team: teamData ? {
            id: teamData.id,
            name: teamData.name,
            allowed_menus: teamData.allowed_menus || [],
            department: deptData,
          } : undefined,
          sidebarPermissions,
        });
      } catch (error) {
        console.error("🚨 fetchUser 에러:", error);
      }
    };

    fetchUser();
  }, []);

  // const { data, error } = await supabase.auth.getSession();
  // console.log("data", data);

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       // API 호출
  //       const response = await fetch(`/api/user`);
  //       const resdata = await response.json();

  //       if (!resdata.email) {
  //         console.error("API returned invalid user data:", resdata);
  //         return;
  //       }

  //       // Supabase 호출
  //       const { data, error } = await supabase
  //         .from("users")
  //         .select("name, id, position, level")
  //         .eq("email", resdata.email);

  //       if (error) {
  //         console.error("Error fetching user data from Supabase:", error);
  //         return;
  //       }

  //       if (!data || data.length === 0) {
  //         console.error("No user found in Supabase for email:", resdata.email);
  //         return;
  //       }

  //       // 상태 업데이트
  //       setLoginUser({
  //         email: resdata.email,
  //         role: resdata.role || "user", // 기본 역할 설정
  //         name: data[0].name,
  //         id: data[0].id,
  //         position: data[0].position || "",
  //         level: data[0].level || "",
  //       });
  //     } catch (error) {
  //       console.error("Error in fetchUser:", error);
  //     }
  //   };

  //   fetchUser();
  // }, []);

  return (
    <LoginUserContext.Provider value={{ loginUser, setLoginUser }}>
      {children}
    </LoginUserContext.Provider>
  );
}

// 로그인 정보 읽는 훅
export function useLoginUser(): LoginUser | undefined {
  const ctx = useContext(LoginUserContext);
  return ctx?.loginUser; // null이면 undefined
}

// **Setter**를 보장하는 훅
export function useSetLoginUser(): React.Dispatch<
  React.SetStateAction<LoginUser | undefined>
> {
  const ctx = useContext(LoginUserContext);
  if (!ctx) {
    // Provider 밖에서 사용 시 에러
    throw new Error("useSetLoginUser must be used within a LoginUserProvider");
  }
  return ctx.setLoginUser;
}
