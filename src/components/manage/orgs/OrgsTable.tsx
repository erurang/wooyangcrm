"use client";

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  rnds_contacts: any[];
}

interface OrgsTableProps {
  orgs: RnDsOrgs[];
  onEdit: (org: RnDsOrgs) => void;
  onDelete: (org: RnDsOrgs) => void;
}

export default function OrgsTable({ orgs, onEdit, onDelete }: OrgsTableProps) {
  return (
    <div className="bg-[#FBFBFB] rounded-md border">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="px-4 py-2 border-b border-r-[1px] w-3/12">기관명</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell w-2/12">
              주소
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              번호
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              팩스
            </th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
              이메일
            </th>
            <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
            <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
              삭제
            </th>
          </tr>
        </thead>
        <tbody>
          {orgs?.map((org) => (
            <tr key={org.id} className="hover:bg-gray-100 text-center">
              <td className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer">
                {org.name}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                {org.address}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {org.phone}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {org.fax}
              </td>
              <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                {org.email}
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                onClick={() => onEdit(org)}
              >
                수정
              </td>
              <td
                className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
                onClick={() => onDelete(org)}
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
