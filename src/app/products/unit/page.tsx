import { Suspense } from "react";
import ProductPage from "./Product";

export default function ProductsUnitPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ProductPage />
    </Suspense>
  );
}
