"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

// 타입 정의
interface DeleteRequest {
  id: number;
  document_id: string;
  document_type: string;
  requested_by: string;
  request_date: string;
  status: string;
  reason: string;
}

export default function DeleteRequestsPage() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("delete_requests")
        .select("*")
        .eq("status", "pending");

      if (error) {
        console.error("삭제 요청 불러오기 실패:", error);
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error("요청 데이터 불러오기 중 오류:", err);
    }
  };

  const handleApprove = async (request: DeleteRequest) => {
    try {
      // 요청된 문서 유형에 따라 삭제 처리
      if (request.document_type === "company") {
        await supabase.from("companies").delete().eq("id", request.document_id);
      } else if (request.document_type === "estimate") {
        await supabase.from("documents").delete().eq("id", request.document_id);
      } else if (request.document_type === "consultation") {
        await supabase
          .from("consultations")
          .delete()
          .eq("id", request.document_id);
      } else {
        throw new Error("알 수 없는 문서 유형입니다.");
      }

      // 요청 상태 업데이트
      await supabase
        .from("delete_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      alert("삭제가 승인되었습니다.");
      fetchRequests();
    } catch (error) {
      console.error("삭제 승인 실패:", error);
      alert("삭제 승인에 실패했습니다.");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await supabase
        .from("delete_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      alert("삭제 요청이 거부되었습니다.");
      fetchRequests();
    } catch (error) {
      console.error("삭제 거부 실패:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        삭제 요청 관리
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>요청 ID</TableCell>
              <TableCell>문서 ID</TableCell>
              <TableCell>문서 유형</TableCell>
              <TableCell>요청자</TableCell>
              <TableCell>요청 날짜</TableCell>
              <TableCell>사유</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.id}</TableCell>
                <TableCell>{req.document_id}</TableCell>
                <TableCell>{req.document_type}</TableCell>
                <TableCell>{req.requested_by}</TableCell>
                <TableCell>
                  {new Date(req.request_date).toLocaleString()}
                </TableCell>
                <TableCell>{req.reason}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleApprove(req)}
                  >
                    승인
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleReject(req.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    거부
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
