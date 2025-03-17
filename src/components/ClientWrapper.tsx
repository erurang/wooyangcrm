"use client";

import Sidebar from "@/components/Sidebar";
import { LoginUserProvider } from "@/context/login";
import { useSearchParams } from "next/navigation";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // const searchParams = useSearchParams();
  // const isFullscreen = searchParams.get("fullscreen") === "true"; // 🔥 URL에 fullscreen=true가 있으면 활성화

  return (
    <LoginUserProvider>
      <div className="min-h-screen flex flex-col">
        <Sidebar />
        {/* {!isFullscreen && 
      } */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </LoginUserProvider>
  );
}
