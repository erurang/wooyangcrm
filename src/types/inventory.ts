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
