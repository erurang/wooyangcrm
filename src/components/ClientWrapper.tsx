"use client";

import Layout from "@/components/layout/Layout";
import { LoginUserProvider } from "@/context/login";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoginUserProvider>
      <Layout>{children}</Layout>
    </LoginUserProvider>
  );
}
