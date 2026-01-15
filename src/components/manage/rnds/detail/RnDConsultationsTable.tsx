"use client";

import FileUpload from "@/components/consultations/FileUpload";

interface Consultation {
  id: string;
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: "참여" | "주관기관" | "공동연구기관";
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string;
}

interface User {
  id: string;
  name: string;
  level: string;
}

interface RnDConsultationsTableProps {
  consultations: Consultation[];
  users: User[];
  loginUserId: string | undefined;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (consultation: Consultation) => void;
  onDelete: (consultation: Consultation) => void;
}

const formatNumber = (value: string) => {
  const cleanedValue = value?.replace(/[^0-9]/g, "") || "";
  return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatContentWithLineBreaks = (content: string) => {
  return content.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));
};

export default function RnDConsultationsTable({
  consultations,
  users,
  loginUserId,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: RnDConsultationsTableProps) {
  const prevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const paginationNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  const getUserInfo = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} ${user.level}` : "";
  };

  return (
    <>
      {/* Table */}
      <div className="bg-[#FBFBFB] rounded-md border">
        {consultations.length > 0 && (
          <table className="min-w-full table-auto border-collapse text-center">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  작성일자
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  수행기간
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  총 사업비
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  정부 출연금
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  민간 부담금
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-2/12">
                  내용
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  참여유형
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  담당자
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-2/12">
                  문서
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                  변경
                </th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((consultation) => (
                <tr
                  key={consultation.id}
                  className="hover:bg-gray-100 border-b"
                >
                  <td className="px-4 py-2 border-r-[1px]">{consultation.date}</td>
                  <td className="px-4 py-2 border-r-[1px]">
                    {consultation.start_date} ~ {consultation.end_date}
                  </td>
                  <td className="px-4 py-2 border-x-[1px]">
                    {formatNumber(consultation.total_cost)} 원
                  </td>
                  <td className="px-2 py-2 border-r-[1px]">
                    {formatNumber(consultation.gov_contribution)} 원
                  </td>
                  <td className="px-2 py-2 border-r-[1px]">
                    {formatNumber(consultation.pri_contribution)} 원
                  </td>
                  <td
                    className="px-4 py-2 w-full text-start"
                    style={{
                      minHeight: "140px",
                      maxHeight: "140px",
                      overflowY: "auto",
                      display: "block",
                    }}
                  >
                    {formatContentWithLineBreaks(consultation.content)}
                  </td>
                  <td className="px-4 py-2 border-x-[1px]">
                    {consultation.participation}
                  </td>
                  <td className="px-4 py-2 border-r-[1px]">
                    {getUserInfo(consultation.user_id)}
                  </td>
                  <td className="px-4 py-2 border-x-[1px]">
                    <FileUpload
                      consultationId={consultation.id}
                      userId={loginUserId}
                    />
                  </td>
                  <td className="py-2 border-x-[1px]">
                    <span
                      className={`px-4 py-2 border-r-[1px] ${
                        loginUserId === consultation.user_id &&
                        "text-blue-500 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (loginUserId === consultation.user_id)
                          onEdit(consultation);
                      }}
                    >
                      수정
                    </span>
                    <span
                      className={`px-4 py-2 ${
                        loginUserId === consultation.user_id &&
                        "text-red-500 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (loginUserId === consultation.user_id)
                          onDelete(consultation);
                      }}
                    >
                      삭제
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === "number" && onPageChange(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    </>
  );
}
