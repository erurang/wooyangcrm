"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Snackbar, Alert } from "@mui/material"; // MUI Snackbar 임포트

interface DeletionRequest {
  id: string;
  type: string;
  related_id: string; // 삭제할 회사의 id
  status: string;
  created_at: string;
}

export default function DeletionRequestsPage() {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(
    []
  );
  const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  useEffect(() => {
    const fetchDeletionRequests = async () => {
      const { data, error } = await supabase
        .from("deletion_requests")
        .select("*");

      if (error) {
        setSnackbarMessage("삭제 요청을 가져오는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setDeletionRequests(data);
      }
    };

    fetchDeletionRequests();
  }, []);

  // 승인 버튼 클릭 시 요청 승인 처리
  const handleApprove = async (requestId: string, companyId: string) => {
    // 삭제 요청 승인 처리
    const { error: approveError } = await supabase
      .from("deletion_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

    if (approveError) {
      setSnackbarMessage("요청 승인에 실패했습니다.");
      setOpenSnackbar(true);
    } else {
      setSnackbarMessage("요청이 승인되었습니다.");
      setOpenSnackbar(true);

      // 삭제된 회사와 관련된 데이터 처리
      await handleDeleteCompany(companyId);

      // 업데이트된 데이터 반영
      setDeletionRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );
    }
  };

  // 삭제된 회사와 관련된 데이터 처리
  const handleDeleteCompany = async (companyId: string) => {
    try {
      // 관련된 모든 데이터를 삭제

      // 1. 회사 삭제
      const { error: deleteCompanyError } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (deleteCompanyError) throw new Error("회사 삭제 실패");

      // 2. 관련된 상담 내역 삭제
      await supabase.from("consultations").delete().eq("company_id", companyId);

      // 3. 관련된 견적서 삭제
      await supabase.from("estimates").delete().eq("company_id", companyId);

      // 4. 관련된 발주서 삭제
      await supabase
        .from("purchase_orders")
        .delete()
        .eq("company_id", companyId);

      setSnackbarMessage("회사와 관련된 데이터가 모두 삭제되었습니다.");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage("회사를 삭제하는 도중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  // 거부 버튼 클릭 시 요청 거부 처리
  const handleReject = async (requestId: string) => {
    const { error: rejectError } = await supabase
      .from("deletion_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (rejectError) {
      setSnackbarMessage("요청 거부에 실패했습니다.");
      setOpenSnackbar(true);
    } else {
      setSnackbarMessage("요청이 거부되었습니다.");
      setOpenSnackbar(true);

      // 업데이트된 데이터 반영
      setDeletionRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );
    }
  };

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4">삭제 요청 관리</p>

      {/* 삭제 요청 목록 */}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b border-r-[1px]">No.</th>
              <th className="px-4 py-2 border-b border-r-[1px]">삭제 대상</th>
              <th className="px-4 py-2 border-b border-r-[1px]">삭제 유형</th>
              <th className="px-4 py-2 border-b border-r-[1px]">요청 상태</th>
              <th className="px-4 py-2 border-b border-r-[1px]">요청일</th>
              <th className="px-4 py-2 border-b border-r-[1px]">승인</th>
              <th className="px-4 py-2 border-b border-r-[1px]">거부</th>
            </tr>
          </thead>
          <tbody>
            {deletionRequests.map((request, index) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {index + 1}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {request.related_id}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {request.type}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {request.status}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  {new Date(request.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  <button
                    onClick={() =>
                      handleApprove(request.id, request.related_id)
                    }
                    className="text-green-500"
                  >
                    승인
                  </button>
                </td>
                <td className="px-4 py-2 border-b border-r-[1px]">
                  <button
                    onClick={() => handleReject(request.id)}
                    className="text-red-500"
                  >
                    거부
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 스낵바 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "bottom", // 하단
          horizontal: "right", // 오른쪽
        }}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
