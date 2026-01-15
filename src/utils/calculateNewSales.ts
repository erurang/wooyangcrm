interface SalesDocument {
  id: string;
  company_id: string;
  type: string;
  status: string;
  content?: {
    total_amount?: number;
  };
}

interface Company {
  id: string;
  created_at: string;
}

interface Consultation {
  id: string;
  company_id: string;
}

export function calculateNewSales(
  documents: SalesDocument[],
  companies: Company[],
  consultations: Consultation[]
) {
  if (!documents || !companies || !consultations) {
    return { newSales: null, current_month_performance: null };
  }

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  /** 📌 신규 고객사 리스트 */
  const newClients = companies
    .filter((company) => new Date(company.created_at) >= startOfMonth)
    .map((company) => company.id);

  /** 📌 신규 상담 개수 */
  const newConsultationsCount = consultations.filter((consultation) =>
    newClients.includes(consultation.company_id)
  ).length;

  /** 📌 기존 고객사 리스트 */
  const existingClients = companies
    .filter((company) => !newClients.includes(company.id))
    .map((company) => company.id);

  /** 📌 금액 합산 함수 */
  const extractTotalAmount = (docs: SalesDocument[]) =>
    docs.reduce((acc, doc) => acc + (doc.content?.total_amount || 0), 0);

  /** 📌 신규 영업 기회 */
  const newOpportunities = documents.filter(
    (doc) =>
      newClients.includes(doc.company_id) &&
      doc.type === "estimate" &&
      doc.status === "pending"
  );

  /** 📌 신규 견적 완료 */
  const newEstimatesCompleted = documents.filter(
    (doc) =>
      newClients.includes(doc.company_id) &&
      doc.type === "estimate" &&
      doc.status === "completed"
  );

  /** 📌 기존 영업 기회 */
  const existingOpportunities = documents.filter(
    (doc) =>
      existingClients.includes(doc.company_id) &&
      doc.type === "estimate" &&
      doc.status === "pending"
  );

  /** 📌 기존 견적 완료 */
  const existingEstimatesCompleted = documents.filter(
    (doc) =>
      existingClients.includes(doc.company_id) &&
      doc.type === "estimate" &&
      doc.status === "completed"
  );

  /** 📌 기존 상담 개수 */
  const existingConsultationsCount =
    consultations.length - newConsultationsCount;

  return {
    newSales: {
      new_clients_count: newClients.length,
      new_consultations_count: newConsultationsCount,
      new_opportunities: extractTotalAmount(newOpportunities),
      new_estimate_completed: extractTotalAmount(newEstimatesCompleted),
    },
    current_month_performance: {
      total_consultations: existingConsultationsCount,
      total_opportunities: extractTotalAmount(existingOpportunities),
      total_estimate_completed: extractTotalAmount(existingEstimatesCompleted),
    },
  };
}
