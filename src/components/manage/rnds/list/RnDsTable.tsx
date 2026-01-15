"use client";

interface RnDs {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs: {
    name: string;
  };
}

interface RnDsTableProps {
  rnds: RnDs[];
  onRowClick: (id: string) => void;
  onEdit: (rnd: RnDs) => void;
  onDelete: (rnd: RnDs) => void;
  formatNumber: (value: string) => string;
}

export default function RnDsTable({
  rnds,
  onRowClick,
  onEdit,
  onDelete,
  formatNumber,
}: RnDsTableProps) {
  return (
    <div className="bg-[#FBFBFB] rounded-md border">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="px-4 py-2 border-b border-r-[1px] w-3/12">사업명</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell w-2/12">
              총 사업기간
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              총 사업비
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              정부 출연금
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              지원기관
            </th>
            <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
              삭제
            </th>
          </tr>
        </thead>
        <tbody>
          {rnds?.map((rnd) => (
            <tr key={rnd.id} className="hover:bg-gray-100 text-center">
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onRowClick(rnd.id)}
              >
                {rnd.name}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                {rnd.start_date} ~ {rnd.end_date}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {formatNumber(rnd.total_cost)} 원
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {formatNumber(rnd.gov_contribution)} 원
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {rnd.rnd_orgs?.name}
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onEdit(rnd)}
              >
                수정
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
                onClick={() => onDelete(rnd)}
              >
                삭제
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
