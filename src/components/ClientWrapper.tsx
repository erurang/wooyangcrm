"use client";

import Layout from "@/components/layout/Layout";
import { LoginUserProvider } from "@/context/login";
import { ToastProvider } from "@/context/toast";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginUserProvider>
      <ToastProvider>
        <Layout>{children}</Layout>
      </ToastProvider>
    </LoginUserProvider>
  );
}
