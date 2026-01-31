// 입고정산 관련 타입 정의 (다건 정산 지원)

export type SettlementStatus = "pending" | "settled";

// 정산 마스터 DB 타입
export interface ImportSettlement {
  id: string;
  company_id: string;

  // 정산 기본 정보
  settlement_date?: string;
  settlement_number?: string;

  // 송금 정보
  remittance_date?: string;
  remittance_amount: number;
  remittance_currency?: string;
  remittance_original?: number;
  exchange_rate?: number;

  // 세금계산서 정보
  tax_invoice_date?: string;
  tax_invoice_number?: string;
  supply_amount: number;
  vat_amount: number;
  tax_invoice_total: number;

  // 환차손/통관료
  exchange_loss_customs: number;

  // 상태
  status: SettlementStatus;
  settled_at?: string;
  settled_by?: string;

  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // 조인된 데이터
  company?: {
    id: string;
    name: string;
  };
  settled_by_user?: {
    id: string;
    name: string;
  };
  // 포함된 항목들
  items?: ImportSettlementItem[];
  item_count?: number;
  total_item_amount?: number;
}

// 정산 항목 (통관 건)
export interface ImportSettlementItem {
  id: string;
  settlement_id: string;
  customs_cost_id?: string;
  consultation_id?: string;
  item_amount: number;
  item_currency?: string;
  created_at: string;

  // 조인된 데이터
  customs_cost?: {
    id: string;
    invoice_no?: string;
    clearance_date?: string;
  };
  consultation?: {
    id: string;
    oc_number?: string;
    product_name?: string;
    specification?: string;
    total_remittance?: number;
    currency?: string;
  };
}

// 정산 가능한 통관 건 (미정산)
export interface SettleableCustomsCost {
  customs_cost_id: string;
  company_id: string;
  company_name: string;
  consultation_id?: string;
  oc_number?: string;
  product_name?: string;
  specification?: string;
  clearance_date?: string;
  invoice_no?: string;
  item_amount?: number;       // 물품가 (상담의 total_remittance)
  item_currency?: string;
  total_customs_cost?: number; // 통관비용 합계
  created_at: string;
}

// 입고정산 폼 데이터
export interface ImportSettlementFormData {
  company_id: string;
  settlement_date: string;

  // 선택한 통관 건들
  items: {
    customs_cost_id: string;
    consultation_id?: string;
    item_amount: number;
    item_currency?: string;
  }[];

  // 송금 정보
  remittance_date: string;
  remittance_amount: string | number;
  remittance_currency: string;
  remittance_original?: string | number;
  exchange_rate?: string | number;

  // 세금계산서 정보
  tax_invoice_date: string;
  tax_invoice_number?: string;
  supply_amount: string | number;
  vat_amount: string | number;

  notes: string;
}

// 선송금 미입고 잔액
export interface PendingRemittanceBalance {
  company_id: string;
  company_name: string;
  pending_count: number;
  pending_remittance_total: number;
  currency: string;
}

// 상태 라벨
export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: "정산 대기",
  settled: "정산 완료",
};
