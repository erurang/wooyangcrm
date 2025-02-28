// context/login.ts
"use client";
import { supabase } from "@/lib/supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";

interface LoginUser {
  email: string;
  role: string;
  name: string;
  id: string;
  level: string;
  position: string;
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
        // API 호출
        const response = await fetch(`/api/user`);
        const resdata = await response.json();

        if (!resdata.email) {
          console.error("API returned invalid user data:", resdata);
          return;
        }

        // Supabase 호출
        const { data, error } = await supabase
          .from("users")
          .select("name, id, position, level")
          .eq("email", resdata.email);

        if (error) {
          console.error("Error fetching user data from Supabase:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.error("No user found in Supabase for email:", resdata.email);
          return;
        }

        // 상태 업데이트
        setLoginUser({
          email: resdata.email,
          role: resdata.role || "user", // 기본 역할 설정
          name: data[0].name,
          id: data[0].id,
          position: data[0].position || "",
          level: data[0].level || "",
        });
      } catch (error) {
        console.error("Error in fetchUser:", error);
      }
    };

    fetchUser();
  }, []);

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
