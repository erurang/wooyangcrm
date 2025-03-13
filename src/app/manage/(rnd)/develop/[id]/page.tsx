import { Suspense } from "react";
import DevelopPage from "./Develop";

export default function DeveloperWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DevelopPage />
    </Suspense>
  );
}
