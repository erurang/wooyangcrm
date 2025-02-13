import { Suspense } from "react";
import ConsultationPage from "./Consultpage";

export default function ConsultationsIDPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ConsultationPage />
    </Suspense>
  );
}
