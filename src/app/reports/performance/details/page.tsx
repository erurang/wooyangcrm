import { Suspense } from "react";
import PerformanceDetails from "./PerformanceDetails";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <PerformanceDetails />
    </Suspense>
  );
}
