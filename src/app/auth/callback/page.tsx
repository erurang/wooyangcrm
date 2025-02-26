"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLoginSetUser } from "@/context/login";

interface UserInfo {
  id: string;
  auth_id: string | null;
  name: string;
  role_id: any;
  level: string;
  position: string;
  email: string;
  mobile: string;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const { setLoginUser } = useLoginSetUser(); // Provider에서 가져옴

  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token_hash = searchParams.get("token_hash");
  const email = searchParams.get("email");
  const type = searchParams.get("type");

  useEffect(() => {
    const fetchUserInfo = async () => {
      console.log("🔗 현재 URL:", window.location.href);

      const res = await fetch(`/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          token_hash,
          type: "email",
        }),
      });

      const { session, message } = await res.json();

      console.log("session auth/callback", session, message);
      console.log("session.session", session.session);
      console.log("session.session.user", session.session.user);
      console.log("session.session.user.email", session.session.user.email);

      // ✅ `users` 테이블에서 기존 사용자 정보 조회 (`LOWER(email)` 사용)
      if (!session.session.user.email) {
        console.error("❌ 이메일이 없습니다. 인증 오류.");
        setError("이메일 정보가 없습니다. 다시 로그인하세요.");
        return router.push("/login");
      }

      let { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, auth_id, name, role_id, level, position, email, mobile")
        .eq("email", session.session.user.email) // ✅ undefined 방지
        .maybeSingle();

      if (userError || !userData) {
        console.error(
          "❌ 해당 이메일이 등록되지 않은 사용자입니다:",
          session.session.user.email
        );
        setError("등록되지 않은 사용자입니다. 관리자에게 문의하세요.");
        await supabase.auth.signOut(); // 로그아웃 처리
        return router.push("/login");
      }

      // 🚨 `auth_id`가 NULL이면 업데이트
      if (!userData.auth_id) {
        console.log("🔄 `auth_id`가 NULL이므로 업데이트 중...");
        const { error: updateError } = await supabase
          .from("users")
          .update({ auth_id: userData.auth_id })
          .eq("email", session.session.user.email);

        if (updateError) {
          console.error("❌ `auth_id` 업데이트 실패:", updateError);
          setError("서버 오류로 인해 로그인할 수 없습니다.");
          await supabase.auth.signOut();
          return router.push("/login");
        }

        // ✅ 업데이트 후 다시 조회
        ({ data: userData } = await supabase
          .from("users")
          .select("id, auth_id, name, role_id, level, position, email, mobile")
          .eq("email", session.session.user.email)
          .maybeSingle());

        console.log("✅ `auth_id` 업데이트 완료:", userData);
      }

      console.log("✅ 최종 사용자 정보:", userData);
      setLoginUser(userData);
      router.push("/");
    };

    fetchUserInfo();
  }, [router]);

  return (
    <div>
      {error ? (
        <p>{error}</p>
      ) : userInfo ? (
        `안녕하세요, ${userInfo.name}!`
      ) : (
        "로그인 중..."
      )}
    </div>
  );
}
