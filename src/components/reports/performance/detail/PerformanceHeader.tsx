"use client";

import { useRouter } from "next/navigation";

interface PerformanceHeaderProps {
  type: string | null;
  companyName: string;
}

export default function PerformanceHeader({
  type,
  companyName,
}: PerformanceHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-4">
      {type === "estimate" ? (
        <span
          className="cursor-pointer text-sky-500 hover:font-bold"
          onClick={() =>
            router.push("/reports/performance/details?type=estimate")
          }
        >
          매출 분석
        </span>
      ) : (
        <span
          className="cursor-pointer text-sky-500 hover:font-bold"
          onClick={() => router.push("/reports/performance/details?type=order")}
        >
          매입 분석
        </span>
      )}{" "}
      - <span className="font-bold">{companyName}</span>
    </div>
  );
}
