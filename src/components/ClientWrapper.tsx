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
      <div className="h-screen flex">
        <Sidebar />
        {/* {!isFullscreen && 
      } */}
        <main className="overflow-auto w-full p-4">{children}</main>
      </div>
    </LoginUserProvider>
  );
}
