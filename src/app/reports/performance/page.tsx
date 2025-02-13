import { Suspense } from "react";
import PerformancePage from "./PerformancePage";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <PerformancePage />
    </Suspense>
  );
}
