import { Suspense } from "react";
import DocumentsDetailsPage from "./DocumentDetails";

export default function DocumentsDetailsPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DocumentsDetailsPage />
    </Suspense>
  );
}
