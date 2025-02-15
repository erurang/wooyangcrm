import "./globals.css";
import { LoginUserProvider } from "@/context/login";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <LoginUserProvider>
          <div className="h-screen flex">
            <Sidebar />
            <main className="overflow-auto w-full p-4">{children}</main>
          </div>
        </LoginUserProvider>
      </body>
    </html>
  );
}

/** 📌 메뉴 리스트 */
