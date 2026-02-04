// Inventory related types

export type InventoryTaskType = "inbound" | "outbound";
export type InventoryTaskStatus = "pending" | "assigned" | "completed" | "canceled";
export type InventoryTaskSource = "document" | "overseas"; // 문서 기반 vs 해외 상담 기반

// 재고 작업 (입고/출고)
export interface InventoryTask {
  id: string;
  document_id: string;
  document_number: string;
  document_type: "order" | "estimate"; // order → inbound, estimate → outbound
  task_type: InventoryTaskType;
  company_id: string;
  company_name?: string;
  expected_date: string | null;
  status: InventoryTaskStatus;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// document_items 테이블에서 가져온 품목 (DB 기반)
export interface DocumentItemDB {
  id: string;
  item_number: number;
  name: string;
  spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
  product_id: string | null;
}

// 작업 + 관계 데이터
export interface InventoryTaskWithDetails extends InventoryTask {
  // 데이터 출처 구분 (document: 기존 문서 기반, overseas: 해외 상담 기반)
  source?: InventoryTaskSource;
  // 해외 상담 ID (overseas 타입인 경우)
  consultation_id?: string;
  document?: {
    id: string;
    document_number: string;
    type: string;
    date: string;
    content: {
      items: InventoryItem[];
    };
    // document_items 테이블에서 조인된 품목 (신규)
    items?: DocumentItemDB[];
    delivery_date: string | null;
    valid_until: string | null;
    total_amount: number;
  };
  // 해외 상담 정보 (overseas 타입인 경우)
  consultation?: {
    id: string;
    date: string;
    content: string;
    order_type: "import" | "export";
    trade_status: string;
    order_date: string | null;
    expected_completion_date: string | null;
    pickup_date: string | null;
    arrival_date: string | null;
    oc_number: string | null;
    overseas_company?: {
      id: string;
      name: string;
    };
  };
  company?: {
    id: string;
    name: string;
  };
  // 해외 거래처 정보 (overseas 타입인 경우)
  overseas_company?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    level: string;
  };
  assigner?: {
    id: string;
    name: string;
    level: string;
  };
  completer?: {
    id: string;
    name: string;
    level: string;
  };
}

// 문서에서 가져온 품목 정보 (가격 제외)
export interface InventoryItem {
  name: string;
  spec?: string;
  quantity: string | number;
  unit?: string;
  number?: number;
}

// 입고 목록용 데이터
export interface InboundTask extends InventoryTaskWithDetails {
  task_type: "inbound";
}

// 출고 목록용 데이터
export interface OutboundTask extends InventoryTaskWithDetails {
  task_type: "outbound";
}

// API 요청/응답 타입
export interface CreateInventoryTaskRequest {
  document_id: string;
}

export interface UpdateInventoryTaskRequest {
  expected_date?: string | null;
  status?: InventoryTaskStatus;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface AssignInventoryTaskRequest {
  assigned_to: string;
  assigned_by: string;
}

export interface CompleteInventoryTaskRequest {
  completed_by: string;
}

export interface InventoryTaskListResponse {
  tasks: InventoryTaskWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

// 필터 타입
export interface InventoryTaskFilters {
  task_type?: InventoryTaskType;
  status?: InventoryTaskStatus | "all" | "overdue";
  company_id?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// 지연 여부 확인 헬퍼
export function isOverdue(task: InventoryTask | InventoryTaskWithDetails): boolean {
  if (task.status === "completed" || task.status === "canceled") return false;
  if (!task.expected_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expectedDate = new Date(task.expected_date);
  expectedDate.setHours(0, 0, 0, 0);
  return expectedDate < today;
}

// 스펙시트 관련 (UI용)
export interface SpecSheetField {
  id: string;
  label: string;
  value: string;
}

export interface SpecSheetPage {
  id: string;
  itemId: string;
  documentNumber: string;
  companyName: string;
  fields: SpecSheetField[];
}

// =====================================================
// LOT 기반 재고 관리 타입
// =====================================================

// LOT 출처 타입
export type LotSourceType = "purchase" | "split" | "production" | "return" | "adjust";

// LOT 상태
export type LotStatus = "available" | "reserved" | "split" | "depleted" | "scrapped";

// LOT 트랜잭션 타입
export type LotTransactionType =
  | "inbound"
  | "outbound"
  | "split_out"
  | "split_in"
  | "adjust"
  | "reserve"
  | "unreserve"
  | "scrap";

// 재고 LOT
export interface InventoryLot {
  id: string;
  product_id: string;
  lot_number: string;
  initial_quantity: number;
  current_quantity: number;
  unit: string | null;
  spec_value: string | null;
  spec_description: string | null;
  source_type: LotSourceType;
  source_lot_id: string | null;
  source_document_id: string | null;
  supplier_company_id: string | null;
  status: LotStatus;
  location: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  received_at: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// LOT + 관계 데이터
export interface InventoryLotWithDetails extends InventoryLot {
  product?: {
    id: string;
    internal_code: string | null;
    internal_name: string;
    unit: string | null;
  };
  source_lot?: {
    id: string;
    lot_number: string;
  };
  source_document?: {
    id: string;
    document_number: string;
    type: string;
  };
  supplier_company?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

// LOT 분할 기록
export interface LotSplit {
  id: string;
  source_lot_id: string;
  source_quantity_before: number;
  split_quantity: number;
  reason: string | null;
  output_lot_id: string | null;
  remnant_lot_id: string | null;
  related_document_id: string | null;
  notes: string | null;
  split_at: string;
  split_by: string | null;
}

// LOT 분할 + 관계 데이터
export interface LotSplitWithDetails extends LotSplit {
  source_lot?: {
    id: string;
    lot_number: string;
    product_id: string;
  };
  output_lot?: {
    id: string;
    lot_number: string;
    current_quantity: number;
  };
  remnant_lot?: {
    id: string;
    lot_number: string;
    current_quantity: number;
  };
  splitter?: {
    id: string;
    name: string;
  };
}

// LOT 트랜잭션
export interface LotTransaction {
  id: string;
  lot_id: string;
  transaction_type: LotTransactionType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  document_id: string | null;
  split_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// LOT 트랜잭션 + 관계 데이터
export interface LotTransactionWithDetails extends LotTransaction {
  lot?: {
    id: string;
    lot_number: string;
    product_id: string;
  };
  document?: {
    id: string;
    document_number: string;
    type: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

// 제품별 LOT 요약 (뷰)
export interface ProductLotSummary {
  product_id: string;
  internal_code: string | null;
  internal_name: string;
  unit: string | null;
  available_lot_count: number;
  available_quantity: number;
  reserved_lot_count: number;
  reserved_quantity: number;
  total_lot_count: number;
}

// LOT 생성 요청
export interface CreateLotRequest {
  product_id: string;
  initial_quantity: number;
  unit?: string;
  spec_value?: string;
  spec_description?: string;
  source_type?: LotSourceType;
  source_document_id?: string;
  supplier_company_id?: string;
  location?: string;
  unit_cost?: number;
  received_at?: string;
  expiry_date?: string;
  notes?: string;
}

// LOT 수정 요청
export interface UpdateLotRequest {
  location?: string;
  unit_cost?: number;
  expiry_date?: string | null;
  notes?: string | null;
  status?: LotStatus;
}

// LOT 분할 요청
export interface SplitLotRequest {
  source_lot_id: string;
  split_quantity: number;
  reason?: string;
  notes?: string;
}

// LOT 분할 응답
export interface SplitLotResponse {
  success: boolean;
  output_lot_id: string;
  remnant_lot_id: string;
  split_id: string;
  output_lot?: InventoryLotWithDetails;
  remnant_lot?: InventoryLotWithDetails;
}

// LOT 목록 응답
export interface LotListResponse {
  lots: InventoryLotWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

// LOT 필터
export interface LotFilters {
  product_id?: string;
  status?: LotStatus | "all";
  source_type?: LotSourceType;
  supplier_company_id?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// LOT 상태 레이블
export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  available: "사용 가능",
  reserved: "예약됨",
  split: "분할됨",
  depleted: "소진",
  scrapped: "폐기",
};

// LOT 상태 색상
export const LOT_STATUS_COLORS: Record<LotStatus, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  split: "bg-blue-100 text-blue-800",
  depleted: "bg-gray-100 text-gray-800",
  scrapped: "bg-red-100 text-red-800",
};

// LOT 출처 레이블
export const LOT_SOURCE_LABELS: Record<LotSourceType, string> = {
  purchase: "구매 입고",
  split: "분할",
  production: "생산",
  return: "반품",
  adjust: "재고 조정",
};

// LOT 트랜잭션 타입 레이블
export const LOT_TRANSACTION_LABELS: Record<LotTransactionType, string> = {
  inbound: "입고",
  outbound: "출고",
  split_out: "분할 소멸",
  split_in: "분할 생성",
  adjust: "재고 조정",
  reserve: "예약",
  unreserve: "예약 해제",
  scrap: "폐기",
};
