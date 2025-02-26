"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// 로그인 정보 타입
interface LoginUser {
  auth_id: string;
  email: string;
  role: string;
  name: string;
  id: string;
  level: string;
  position: string;
}

interface LoginUserContextValue {
  loginUser: LoginUser | null;
  setLoginUser: React.Dispatch<React.SetStateAction<LoginUser | null>>;
}

// 로그인 정보를 제공할 Context 생성
// const LoginUserContext = createContext<LoginUser | null>(null);

const LoginUserContext = createContext<LoginUserContextValue | null>(null);

// 로그인 정보를 제공하는 Provider 컴포넌트
export const LoginUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       // ✅ 1️⃣ Supabase 세션 확인 (getSession() 대신 getUser())
  //       const {
  //         data: { user },
  //         error: userError,
  //       } = await supabase.auth.getUser();

  //       if (userError || !user) {
  //         console.error("❌ 세션 없음, 로그인 필요", userError);
  //         router.push("/login");
  //         return;
  //       }

  //       console.log("✅ 로그인된 사용자:", user);

  //       // ✅ 2️⃣ users 테이블에서 사용자 정보 가져오기
  //       const { data: userData, error: userError2 } = await supabase
  //         .from("users")
  //         .select(
  //           "id, auth_id, name, roles(id,role_name), level, position, email"
  //         )
  //         .eq("auth_id", user.id)
  //         .maybeSingle();

  //       if (userError2) {
  //         console.error("❌ 사용자 정보 조회 실패:", userError2);
  //         return;
  //       }

  //       if (!userData) {
  //         console.error("🚨 해당 이메일이 등록되지 않음:", user.email);
  //         router.push("/error"); // ❌ 미등록 사용자 차단
  //         return;
  //       }

  //       console.log("✅ 사용자 정보 조회 완료:", userData);

  //       // ✅ 상태 업데이트
  //       setLoginUser({
  //         auth_id: userData.auth_id,
  //         email: userData.email,
  //         role: (userData as any).roles.role_name || "user", // 기본 역할 설정
  //         name: userData.name,
  //         id: userData.id,
  //         position: userData.position || "",
  //         level: userData.level || "",
  //       });
  //     } catch (error) {
  //       console.error("🚨 오류 발생:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUser();
  // }, [router]);

  return (
    <LoginUserContext.Provider value={{ loginUser, setLoginUser }}>
      {children}
    </LoginUserContext.Provider>
  );
};

export function useLoginSetUser() {
  const context = useContext(LoginUserContext);
  if (!context) {
    throw new Error("useLoginUser must be used within a LoginUserProvider");
  }
  return context; // { loginUser, setLoginUser }
}

// Context 값을 사용하기 위한 hook
export function useLoginUser() {
  const context = useContext(LoginUserContext);
  return context?.loginUser ?? null;
}

// "use client";

// import { supabase } from "@/lib/supabaseClient";
// import { createContext, useContext, useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// // 로그인 정보 타입
// interface LoginUser {
//   auth_id: string;
//   email: string;
//   role: string;
//   name: string;
//   id: string;
//   level: string;
//   position: string;
// }

// // 로그인 정보를 제공할 Context 생성
// const LoginUserContext = createContext<LoginUser | undefined>(undefined);

// // 로그인 정보를 제공하는 Provider 컴포넌트
// export const LoginUserProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [loginUser, setLoginUser] = useState<LoginUser | undefined>(undefined);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchUser = async () => {
//       // ✅ Supabase 세션 확인
//       const { data: sessionData, error: sessionError } =
//         await supabase.auth.getSession();

//       if (sessionError || !sessionData.session) {
//         console.error("❌ 세션 없음, 로그인 필요");
//         return router.push("/login");
//       }

//       const authUser = sessionData.session.user;

//       console.log("✅ 로그인된 사용자:", authUser);

//       // ✅ users 테이블에서 사용자 정보 가져오기
//       const { data: userData, error: userError } = await supabase
//         .from("users")
//         .select(
//           "id, auth_id, name, roles(id,role_name), level, position, email"
//         )
//         .eq("auth_id", authUser.id)
//         .maybeSingle();

//       if (userError) {
//         console.error("❌ 사용자 정보 조회 실패:", userError);
//         return;
//       }

//       if (!userData) {
//         console.error("🚨 해당 이메일이 등록되지 않음:", authUser.email);
//         return router.push("/error"); // ❌ 미등록 사용자 차단
//       }

//       console.log("✅ 사용자 정보 조회 완료:", userData);

//       // ✅ 상태 업데이트
//       setLoginUser({
//         auth_id: userData.auth_id,
//         email: userData.email,
//         role: (userData as any).roles.role_name || "user", // 기본 역할 설정
//         name: userData.name,
//         id: userData.id,
//         position: userData.position || "",
//         level: userData.level || "",
//       });
//     };

//     fetchUser();
//   }, [router]);

//   return (
//     <LoginUserContext.Provider value={loginUser}>
//       {children}
//     </LoginUserContext.Provider>
//   );
// };

// // Context 값을 사용하기 위한 hook
// export const useLoginUser = (): LoginUser | undefined => {
//   return useContext(LoginUserContext);
// };

// "use client";
// import { supabase } from "@/lib/supabaseClient";
// import { createContext, useContext, useEffect, useState } from "react";

// // 로그인 정보 타입
// interface LoginUser {
//   email: string;
//   role: string;
//   name: string;
//   id: string;
//   level: string;
//   position: string;
// }

// // 로그인 정보를 제공할 Context 생성
// const LoginUserContext = createContext<LoginUser | undefined>(undefined);

// // 로그인 정보를 제공하는 Provider 컴포넌트
// export const LoginUserProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [loginUser, setLoginUser] = useState<LoginUser | undefined>(undefined);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         // API 호출
//         const response = await fetch(`/api/user`);
//         const resdata = await response.json();

//         if (!resdata.email) {
//           console.error("API returned invalid user data:", resdata);
//           return;
//         }

//         // Supabase 호출
//         const { data, error } = await supabase
//           .from("users")
//           .select("name, id, position, level")
//           .eq("email", resdata.email);

//         if (error) {
//           console.error("Error fetching user data from Supabase:", error);
//           return;
//         }

//         if (!data || data.length === 0) {
//           console.error("No user found in Supabase for email:", resdata.email);
//           return;
//         }

//         // 상태 업데이트
//         setLoginUser({
//           email: resdata.email,
//           role: resdata.role || "user", // 기본 역할 설정
//           name: data[0].name,
//           id: data[0].id,
//           position: data[0].position || "",
//           level: data[0].level || "",
//         });
//       } catch (error) {
//         console.error("Error in fetchUser:", error);
//       }
//     };

//     fetchUser();
//   }, []);

//   return (
//     <LoginUserContext.Provider value={loginUser}>
//       {children}
//     </LoginUserContext.Provider>
//   );
// };

// // Context 값을 사용하기 위한 hook
// export const useLoginUser = (): LoginUser | undefined => {
//   return useContext(LoginUserContext);
// };
