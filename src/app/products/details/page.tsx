import { Suspense } from "react";
import ProductPage from "./ProductDetail";

export default function ProductDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ProductPage />
    </Suspense>
  );
}
