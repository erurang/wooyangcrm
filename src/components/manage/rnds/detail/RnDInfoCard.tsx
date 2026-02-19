"use client";

interface RnDDetail {
  id: string;
  name: string;
  notes: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  start_date: string;
  end_date: string;
  rnd_orgs?: {
    id: string;
    name: string;
  };
}

interface RnDInfoCardProps {
  rndsDetail: RnDDetail | null;
  isLoading: boolean;
}

const formatNumber = (value: string) => {
  const cleanedValue = value?.replace(/[^0-9]/g, "") || "";
  return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function RnDInfoCard({ rndsDetail, isLoading }: RnDInfoCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 px-4 pt-3 h-48 flex flex-col justify-between">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 px-4 pt-3 h-48 flex flex-col justify-between">
      <div>
        <h2 className="font-semibold text-md mb-2">{rndsDetail?.name}</h2>
        <ul className="space-y-1 text-slate-600 text-sm pl-1">
          <li className="flex items-center">
            <span className="font-medium w-20">지원기관</span>
            <span className="flex-1 truncate">{rndsDetail?.rnd_orgs?.name}</span>
          </li>
          <li className="flex items-center">
            <span className="font-medium w-20">총 사업비</span>
            <span className="flex-1 truncate">
              {formatNumber(rndsDetail?.total_cost || "")}
            </span>
          </li>
          <li className="flex items-center">
            <span className="font-medium w-20">정부 출연금</span>
            <span className="flex-1">
              {formatNumber(rndsDetail?.gov_contribution || "")}
            </span>
          </li>
          <li className="flex items-center">
            <span className="font-medium w-20">민간 부담금</span>
            <span className="flex-1">
              {formatNumber(rndsDetail?.pri_contribution || "")}
            </span>
          </li>
          <li className="flex items-center">
            <span className="font-medium w-20">총 사업기간</span>
            <span className="flex-1 truncate">
              {rndsDetail?.start_date} ~ {rndsDetail?.end_date}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
