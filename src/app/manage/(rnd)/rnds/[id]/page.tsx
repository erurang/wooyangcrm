import { Suspense } from "react";
import RndsPage from "./Rnds";

export default function RndsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <RndsPage />
    </Suspense>
  );
}
