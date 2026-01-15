import * as XLSX from "xlsx";

interface ExportColumn {
  key: string;
  header: string;
  format?: "currency" | "number" | "text";
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  const { filename, sheetName = "Sheet1", columns } = options;

  // 데이터를 헤더 기준으로 변환
  const rows = data.map((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = item[col.key];
      if (col.format === "currency" && typeof value === "number") {
        row[col.header] = value;
      } else if (col.format === "number" && typeof value === "number") {
        row[col.header] = value;
      } else {
        row[col.header] = value ?? "";
      }
    });
    return row;
  });

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 설정
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.header.length * 2, 15),
  }));
  worksheet["!cols"] = colWidths;

  // 워크북 생성 및 시트 추가
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일명에 날짜 추가
  const date = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${date}.xlsx`;

  // 다운로드
  XLSX.writeFile(workbook, fullFilename);
}

// 거래처 분석 데이터 내보내기
export function exportClientsToExcel(
  clients: { id: string; name: string; consultations: number; estimates: number; orders: number; totalSales: number; totalPurchases: number }[],
  periodLabel: string
): void {
  exportToExcel(clients, {
    filename: `거래처_분석_${periodLabel}`,
    sheetName: "거래처 분석",
    columns: [
      { key: "name", header: "거래처명", format: "text" },
      { key: "consultations", header: "상담 수", format: "number" },
      { key: "estimates", header: "견적서", format: "number" },
      { key: "orders", header: "발주서", format: "number" },
      { key: "totalSales", header: "총 매출", format: "currency" },
      { key: "totalPurchases", header: "총 매입", format: "currency" },
    ],
  });
}

// 품목 분석 데이터 내보내기
export function exportItemsToExcel(
  items: { name: string; spec?: string; quantity: string | number; type: string; total: number }[],
  periodLabel: string
): void {
  exportToExcel(items, {
    filename: `품목_분석_${periodLabel}`,
    sheetName: "품목 분석",
    columns: [
      { key: "name", header: "품목명", format: "text" },
      { key: "spec", header: "규격", format: "text" },
      { key: "quantity", header: "수량", format: "text" },
      { key: "type", header: "구분", format: "text" },
      { key: "total", header: "금액", format: "currency" },
    ],
  });
}
