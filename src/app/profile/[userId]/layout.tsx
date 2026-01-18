// [userId] 하위 라우트는 상위 /profile/layout.tsx에서 이미 탭을 렌더링하므로
// 여기서는 children만 전달
export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
