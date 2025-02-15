interface DocumentType {
  id: any;
  type: string;
  status: string;
  created_at: string;
  content: {
    total_amount: number;
    valid_until: string;
  };
  company_id: any;
  document_number: any;
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
  const salesData = documents.reduce((acc: any, doc) => {
    const dateKey = doc.created_at.split("T")[0];

    if (!acc[dateKey]) {
      acc[dateKey] = { totalSales: 0, totalPurchases: 0, expectedSales: 0 };
    }

    if (doc.status === "completed") {
      if (doc.type === "estimate") {
        acc[dateKey].totalSales += doc.content.total_amount;
        totalSales += doc.content.total_amount;
      } else if (doc.type === "order") {
        acc[dateKey].totalPurchases += doc.content.total_amount;
        totalPurchases += doc.content.total_amount;
      }
    } else if (doc.status === "pending" && doc.type === "estimate") {
      acc[dateKey].expectedSales += doc.content.total_amount;
      expectedSales += doc.content.total_amount;
    }

    return acc;
  }, {});

  /** 📌 2️⃣ 만료 예정 문서 필터링 */
  const expiringDocuments = documents.filter(
    (doc) =>
      doc.type === "estimate" &&
      doc.status === "pending" &&
      new Date(doc.content.valid_until) >= today &&
      new Date(doc.content.valid_until) <= sevenDaysLater
  );

  /** 📌 3️⃣ 문서 상태별 개수 계산 */
  const documentStatusCounts = documents.reduce((acc: any, doc) => {
    const key = `${doc.type}-${doc.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  /** 📌 4️⃣ 배열 형태로 변환 */
  const formattedDocumentStatusCounts = Object.entries(
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
