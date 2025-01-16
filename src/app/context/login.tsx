import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 로그인 정보 타입
interface LoginUser {
  email: string;
  role: string;
  name: string;
  id: string;
}

// 로그인 정보를 제공할 Context 생성
const LoginUserContext = createContext<LoginUser | undefined>(undefined);

// 로그인 정보를 제공하는 Provider 컴포넌트
export const LoginUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loginUser, setLoginUser] = useState<LoginUser>({
    email: "",
    role: "",
    name: "",
    id: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/user`);
      const resdata: { email: string; role: string } = await response.json();

      const { data, error } = await supabase
        .from("users")
        .select("name,id")
        .eq("email", resdata.email);

      if (error || !data || data.length === 0) {
        console.error("User data not found");
        return;
      }

      setLoginUser({
        email: resdata.email,
        role: resdata.role,
        name: data[0].name,
        id: data[0].id,
      });
    };

    fetchUser();
  }, []);

  return (
    <LoginUserContext.Provider value={loginUser}>
      {children}
    </LoginUserContext.Provider>
  );
};

// Context 값을 사용하기 위한 hook
export const useLoginUser = (): LoginUser | undefined => {
  return useContext(LoginUserContext);
};
