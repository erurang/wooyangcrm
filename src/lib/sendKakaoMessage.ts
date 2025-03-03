// export async function sendKakaoBizMessage(phoneNumber: string) {
//   const KAKAO_BIZ_ID = process.env.KAKAO_BIZ_ID; // ✅ 카카오 비즈니스 앱 ID
//   const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY; // ✅ 비즈니스 API 사용을 위한 Admin Key

//   const messageData = {
//     template_id: "TEMPLATE_ID", // ✅ 사전에 등록한 알림톡 템플릿 ID
//     recipient_list: [
//       {
//         recipient_no: phoneNumber, // ✅ 사용자 전화번호 (필수)
//         template_args: {
//           user_name: "윤준성", // ✅ 템플릿에서 사용할 변수 (예: 사용자 이름)
//           login_time: new Date().toLocaleString(), // ✅ 로그인 시간
//         },
//       },
//     ],
//   };

//   const res = await fetch("https://kakaoapi.com/v2/api/talk/biz/send", {
//     method: "POST",
//     headers: {
//       Authorization: `KakaoAK ${KAKAO_ADMIN_KEY}`, // ✅ Admin Key 사용
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(messageData),
//   });

//   const result = await res.json();
//   console.log("📩 카카오 비즈 메시지 응답:", result);

//   if (!res.ok) {
//     console.error("❌ 카카오 비즈 메시지 전송 실패:", result);
//   } else {
//     console.log("✅ 카카오 비즈 메시지 전송 성공!");
//   }
// }

export async function sendKakaoMessage(providerToken: string) {
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const LOGOUT_REDIRECT_URL = "https://wooyangcrm.com/logout"; // ✅ Supabase 로그아웃도 실행

  const messageData = {
    template_object: JSON.stringify({
      object_type: "text",
      text: "로그인 성공! 현재 계정이 로그인되었습니다.",
      link: {
        web_url: "https://wooyangcrm.com",
        mobile_web_url: "https://wooyangcrm.com",
      },
      buttons: [
        {
          title: "🚪 로그아웃",
          link: {
            web_url: `https://kauth.kakao.com/oauth/logout?client_id=${KAKAO_CLIENT_ID}&logout_redirect_uri=${LOGOUT_REDIRECT_URL}`,
            mobile_web_url: `https://kauth.kakao.com/oauth/logout?client_id=${KAKAO_CLIENT_ID}&logout_redirect_uri=${LOGOUT_REDIRECT_URL}`,
          },
        },
      ],
    }),
  };

  const res = await fetch(
    "https://kapi.kakao.com/v2/api/talk/memo/default/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(messageData),
    }
  );

  const result = await res.json();
  console.log("📩 카카오 메시지 응답:", result);

  if (!res.ok) {
    console.error("❌ 카카오 메시지 전송 실패:", result);
  } else {
    console.log("✅ 카카오 메시지 전송 성공!");
  }
}
