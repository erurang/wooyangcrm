// context/login.ts
"use client";
import { createContext, useContext, useState } from "react";

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

  // ... useEffect로 /api/user 호출, setLoginUser 등 로직 생략 ...
  // 현재 생략 가정

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
