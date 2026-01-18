import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

// 기존 /reports/users/[id] 경로를 /reports/performance/[id]로 리다이렉트
export default async function UserDetailRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/reports/performance/${id}`);
}
