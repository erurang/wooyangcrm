"use client";

import Layout from "@/components/layout/Layout";
import { LoginUserProvider, useLoginUser } from "@/context/login";
import { ToastProvider } from "@/context/toast";
import { NotificationBanner } from "@/components/notifications";

function AppContent({ children }: { children: React.ReactNode }) {
  const loginUser = useLoginUser();

  return (
    <>
      <Layout>{children}</Layout>
      <NotificationBanner userId={loginUser?.id} />
    </>
  );
}

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginUserProvider>
      <ToastProvider>
        <AppContent>{children}</AppContent>
      </ToastProvider>
    </LoginUserProvider>
  );
}
