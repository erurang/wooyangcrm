import { Suspense } from "react";
import DocPage from "./DocPage";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DocPage />
    </Suspense>
  );
}
