"use client";

interface Brnds {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs?: {
    name: string;
  };
}

interface BrndsTableProps {
  brnds: Brnds[];
  onRowClick: (id: string) => void;
  onEdit: (brnd: Brnds) => void;
  onDelete: (brnd: Brnds) => void;
}

export default function BrndsTable({
  brnds,
  onRowClick,
  onEdit,
  onDelete,
}: BrndsTableProps) {
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
          {brnds?.map((brnd) => (
            <tr key={brnd.id} className="hover:bg-gray-100 text-center">
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onRowClick(brnd.id)}
              >
                {brnd.name}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                {brnd.start_date} ~ {brnd.end_date}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {brnd.total_cost}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {brnd.gov_contribution}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {brnd.rnd_orgs?.name}
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onEdit(brnd)}
              >
                수정
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
                onClick={() => onDelete(brnd)}
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
