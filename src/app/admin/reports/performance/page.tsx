import { Suspense } from "react";
import Performance from "./Performance";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Performance />
    </Suspense>
  );
}
