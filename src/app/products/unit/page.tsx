import { Suspense } from "react";
import ProductPage from "./Product";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ProductPage />
    </Suspense>
  );
}
