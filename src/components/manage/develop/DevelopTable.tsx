"use client";

interface Develop {
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

interface DevelopTableProps {
  develops: Develop[];
  onRowClick: (id: string) => void;
  onEdit: (develop: Develop) => void;
  onDelete: (develop: Develop) => void;
  formatNumber: (value: string) => string;
}

export default function DevelopTable({
  develops,
  onRowClick,
  onEdit,
  onDelete,
  formatNumber,
}: DevelopTableProps) {
  return (
    <div className="bg-[#FBFBFB] rounded-md border">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="px-4 py-2 border-b border-r-[1px] w-3/12">개발명</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell w-2/12">
              시작
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              종료
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              외부 담당자
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              사내 담당자
            </th>
            <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
              삭제
            </th>
          </tr>
        </thead>
        <tbody>
          {develops?.map((develop) => (
            <tr key={develop.id} className="hover:bg-gray-100 text-center">
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onRowClick(develop.id)}
              >
                {develop.name}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                {develop.start_date} ~ {develop.end_date}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {formatNumber(develop.total_cost)} 원
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {formatNumber(develop.gov_contribution)} 원
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {develop.rnd_orgs?.name}
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onEdit(develop)}
              >
                수정
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
                onClick={() => onDelete(develop)}
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
