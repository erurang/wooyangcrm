"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { handleDeleteRequest } from "@/utils/deleteRequest";

// 타입 정의
interface Company {
  id: string;
  company_code: number;
  name: string;
  address: string;
}

export default function CustomerManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(0); // 현재 페이지
  const [loading, setLoading] = useState(false); // 데이터 로딩 중 여부
  const [hasMore, setHasMore] = useState(true); // 더 많은 데이터가 있는지 여부

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include", // 쿠키 전송
        });

        if (!response.ok) {
          throw new Error("사용자 정보를 가져올 수 없습니다.");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("사용자 정보 가져오기 실패:", error);
      }
    };

    fetchUser();
    fetchCompanies(page); // 초기 데이터 가져오기
  }, [page]);

  const fetchCompanies = async (currentPage: number) => {
    if (loading) return; // 이미 로딩 중이면 중복 요청 방지
    setLoading(true);

    const { data, error } = await supabase
      .from("companies")
      .select("id, company_code, name, address")
      .range(currentPage * 10, (currentPage + 1) * 10 - 1); // 10개씩 가져오기

    if (error) {
      console.error("회사 데이터 가져오기 실패:", error);
      setLoading(false);
      return;
    }

    if (data.length === 0) {
      setHasMore(false); // 더 이상 데이터가 없으면 로드 중단
    } else {
      setCompanies((prev) => [...prev, ...data]); // 기존 데이터에 추가
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    setCompanies([]); // 기존 데이터 초기화
    setPage(0); // 페이지 초기화
    setHasMore(true); // 더 많은 데이터가 있다고 가정
    fetchCompanies(0); // 첫 페이지 데이터 가져오기
  };

  const handleDelete = (companyId: string) => {
    handleDeleteRequest(user, companyId, "company");
  };

  const handleAddCompany = () => {
    window.location.href = "/customers/manage"; // 거래처 추가 페이지로 이동
  };

  const handleCompanyClick = (id: string) => {
    window.location.href = `/customers/manage/${id}`; // 거래처 상세 페이지로 이동
  };

  // 테이블 내부 스크롤 감지
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loading) {
      setPage((prev) => prev + 1); // 다음 페이지로 이동
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        거래처 관리
      </Typography>

      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="거래처명"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          style={{ marginRight: "10px" }}
        />
        <Button variant="contained" onClick={handleSearch}>
          검색
        </Button>
      </div>

      <Button
        variant="contained"
        color="primary"
        onClick={handleAddCompany}
        style={{ marginBottom: "20px" }}
      >
        + 거래처 추가
      </Button>

      <TableContainer
        component={Paper}
        style={{ maxHeight: "400px", overflowY: "scroll" }} // 테이블에 스크롤 적용
        onScroll={handleScroll} // 스크롤 이벤트 핸들러
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>거래처코드</TableCell>
              <TableCell>거래처명</TableCell>
              <TableCell>주소</TableCell>
              <TableCell>삭제</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company, index) => (
              <TableRow key={company.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{company.company_code}</TableCell>
                <TableCell>
                  <Typography
                    style={{
                      color: "#117ce9", // 연한 파란색
                      cursor: "pointer",
                    }}
                    onClick={() => handleCompanyClick(company.id)}
                  >
                    {company.name}
                  </Typography>
                </TableCell>
                <TableCell>{company.address}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(company.id)}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <CircularProgress />
        </div>
      )}
    </div>
  );
}
