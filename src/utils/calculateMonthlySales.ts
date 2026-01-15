interface DocumentItem {
  name: string;
  spec?: string;
  quantity: number | string;
  unit_price: number;
  amount: number;
}

interface DocumentType {
  id: string;
  type: string;
  status: "pending" | "completed" | "canceled" | "expired";
  created_at: string;
  content: {
    items?: DocumentItem[];
  };
  company_id: string;
  document_number: string;
  total_amount: number;
  valid_until: string | null;
  company_name?: string;
}

interface SalesDataEntry {
  totalSales: number;
  totalPurchases: number;
  expectedSales: number;
}

interface DocumentStatusCount {
  type: string;
  status: string;
  count: number;
}

/**
 * 🔹 문서 데이터를 가공하여 필요한 정보들을 반환하는 함수
 */
export function calculateMonthlySales(
  documents: DocumentType[] | null,
  today: Date,
  sevenDaysLater: Date
) {
  if (!documents || documents.length === 0) {
    return {
      salesData: {},
      totalSales: 0,
      totalPurchases: 0,
      expectedSales: 0,
      expiringDocuments: [],
      documentStatusCounts: [],
    };
  }

  let totalSales = 0,
    totalPurchases = 0,
    expectedSales = 0;

  /** 📌 1️⃣ 날짜별 매출, 매입, 예상 매출 계산 */
  const salesData = documents.reduce<Record<string, SalesDataEntry>>((acc, doc) => {
    const dateKey = doc.created_at.split("T")[0];

    if (!acc[dateKey]) {
      acc[dateKey] = { totalSales: 0, totalPurchases: 0, expectedSales: 0 };
    }

    const amount = doc.total_amount ?? 0;

    if (doc.status === "completed") {
      if (doc.type === "estimate") {
        acc[dateKey].totalSales += amount;
        totalSales += amount;
      } else if (doc.type === "order") {
        acc[dateKey].totalPurchases += amount;
        totalPurchases += amount;
      }
    } else if (doc.status === "pending" && doc.type === "estimate") {
      acc[dateKey].expectedSales += amount;
      expectedSales += amount;
    }

    return acc;
  }, {});

  /** 📌 2️⃣ 만료 예정 문서 필터링 */
  const expiringDocuments = documents.filter((doc) => {
    const validUntil = doc.valid_until;
    if (!validUntil) return false;

    const validDate = new Date(validUntil);
    return (
      doc.type === "estimate" &&
      doc.status === "pending" &&
      validDate >= today &&
      validDate <= sevenDaysLater
    );
  });

  /** 📌 3️⃣ 문서 상태별 개수 계산 */
  const documentStatusCounts = documents.reduce<Record<string, number>>((acc, doc) => {
    const key = `${doc.type}-${doc.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  /** 📌 4️⃣ 배열 형태로 변환 */
  const formattedDocumentStatusCounts: DocumentStatusCount[] = Object.entries(
    documentStatusCounts
  ).map(([key, count]) => {
    const [type, status] = key.split("-");
    return { type, status, count };
  });

  return {
    salesData,
    totalSales,
    totalPurchases,
    expectedSales,
    expiringDocuments,
    documentStatusCounts: formattedDocumentStatusCounts,
  };
}
