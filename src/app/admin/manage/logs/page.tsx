"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUsersList } from "@/hooks/useUserList";
import { motion } from "framer-motion";
import {
  diff_match_patch,
  DIFF_INSERT,
  DIFF_DELETE,
  DIFF_EQUAL,
} from "diff-match-patch";

interface Log {
  id: string;
  table_name: string;
  operation: string;
  record_id: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_at: string;
  changed_by?: string;
}

const LogsPage = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [logsPerPage, setLogsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const { users } = useUsersList();

  useEffect(() => {
    fetchLogs();
  }, [
    currentPage,
    logsPerPage,
    selectedUser,
    selectedTable,
    selectedOperation,
  ]);

  const fetchLogs = async () => {
    let query = supabase
      .from("logs")
      .select("*", { count: "exact" })
      .order("changed_at", { ascending: false });

    if (selectedUser) query = query.eq("changed_by", selectedUser);
    if (selectedTable) query = query.eq("table_name", selectedTable);
    if (selectedOperation) query = query.eq("operation", selectedOperation);

    const { data, count, error } = await query.range(
      (currentPage - 1) * logsPerPage,
      currentPage * logsPerPage - 1
    );

    if (error) {
      console.error("Error fetching logs:", error);
      return;
    }
    setLogs(data || []);
    setTotalPages(Math.ceil(count ?? 1 / logsPerPage));
    setTotalLogs(count || 0);
  };

  const highlightDiff = (oldText: string, newText: string) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([operation, text], index) => {
      if (operation === DIFF_INSERT) {
        return (
          <span key={index} className="bg-green-200 px-1 rounded">
            {text}
          </span>
        );
      } else if (operation === DIFF_DELETE) {
        return (
          <span key={index} className="bg-red-200 px-1 rounded line-through">
            {text}
          </span>
        );
      } else {
        return <span key={index}>{text}</span>;
      }
    });
  };

  // 변경자를 찾는 함수
  const getUserName = (log: Log) => {
    let userId =
      log.changed_by || log.new_data?.user_id || log.old_data?.user_id || null;

    if (!userId) return "Unknown";

    const user = users.find((user: any) => user.id === userId);
    return user ? user.name : "Unknown";
  };

  const formatDate = (utcDate: string) => {
    const date = new Date(utcDate);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Seoul",
    }).format(date);
  };

  // 변경된 부분 찾기 (UPDATE일 경우만 비교)
  const getChanges = (
    oldData: Record<string, any> | null,
    newData: Record<string, any> | null
  ) => {
    if (!oldData || !newData) return null;

    let changedFields: { field: string; oldValue: string; newValue: string }[] =
      [];

    Object.keys(newData).forEach((key) => {
      if (
        oldData[key] !== undefined &&
        JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      ) {
        changedFields.push({
          field: key,
          oldValue: JSON.stringify(oldData[key], null, 2),
          newValue: JSON.stringify(newData[key], null, 2),
        });
      }
    });

    return changedFields.length > 0 ? changedFields : null;
  };

  const paginationNumbers = () => {
    let pageNumbers: (number | string)[] = [];
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

  return (
    <div className="p-4 text-sm text-[#37352F]">
      <h2 className="text-lg font-semibold mb-4">
        로그 내역 (총 {totalLogs}개)
      </h2>

      {/* 필터링 UI */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <select
          className="p-2 border rounded-md"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">전체 사용자</option>
          {users.map((user: any) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          className="p-2 border rounded-md"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          <option value="">전체 테이블</option>
          <option value="documents">Documents</option>
          <option value="consultations">Consultations</option>
        </select>
        <select
          className="p-2 border rounded-md"
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value)}
        >
          <option value="">전체 작업</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* 로그 테이블 */}
      <table className="min-w-full border border-gray-300 text-center">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 w-2/12">테이블</th>
            <th className="border p-2 w-1/12">작업</th>
            <th className="border p-2 w-1/12">변경자</th>
            <th className="border p-2 w-2/12">변경 시간</th>
            <th className="border p-2 w-3/12">내용</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const changes =
              log.operation === "UPDATE"
                ? getChanges(log.old_data, log.new_data)
                : null;

            return (
              <tr key={log.id} className="border">
                <td className="border p-2">{log.table_name}</td>
                <td className="border p-2">{log.operation}</td>
                <td className="border p-2">{getUserName(log)}</td>
                <td className="border p-2">{formatDate(log.changed_at)}</td>
                <td className="border p-2 text-left text-xs">
                  {changes ? (
                    changes.map((change, index) => (
                      <div key={index} className="mb-2">
                        <span className="font-bold">{change.field}:</span>{" "}
                        <div className="inline">
                          {highlightDiff(change.oldValue, change.newValue)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {JSON.stringify(log.new_data || log.old_data, null, 2)}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            이전
          </button>

          {paginationNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(Number(page))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
