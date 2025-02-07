import { supabase } from "@/lib/supabaseClient";
import { createContext, useContext, useEffect, useState } from "react";

// 로그인 정보 타입
interface LoginUser {
  email: string;
  role: string;
  name: string;
  id: string;
  level: string;
  position: string;
}

// 로그인 정보를 제공할 Context 생성
const LoginUserContext = createContext<LoginUser | undefined>(undefined);

// 로그인 정보를 제공하는 Provider 컴포넌트
export const LoginUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
        // const { data, error } = await supabase
        //   .from("users")
        //   .select("name, id, position, level")
        //   .eq("email", resdata.email);
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log("userdata", user);

        if (error) {
          console.error("Error fetching user data from Supabase:", error);
          return;
        }

        if (!user) {
          console.error("No user found in Supabase for email:", resdata.email);
          return;
        }

        // 상태 업데이트
        // setLoginUser({
        //   email: resdata.email,
        //   role: resdata.role || "user", // 기본 역할 설정
        //   name: user.name,
        //   id: user.id,
        //   position: user.position || "",
        //   level: user.level || "",
        // });
      } catch (error) {
        console.error("Error in fetchUser:", error);
      }
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
