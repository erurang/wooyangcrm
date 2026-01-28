// 작업지시 관련 타입
export type DeadlineType = "none" | "today" | "tomorrow" | "this_week" | "custom";
export type CompletionType = "any" | "all" | "threshold";
export type WorkOrderStatus = "pending" | "in_progress" | "completed" | "canceled";

export interface WorkOrder {
  id: string;
  title: string;
  content: string | null;
  deadline_type: DeadlineType;
  deadline_start: string | null;
  deadline_end: string | null;
  requester_id: string;
  requester?: {
    id: string;
    name: string;
  };
  completion_type: CompletionType;
  completion_threshold: number;
  status: WorkOrderStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
  cancel_reason: string | null;
  // 조인된 데이터
  assignees?: WorkOrderAssignee[];
  files?: WorkOrderFile[];
}

export interface WorkOrderAssignee {
  id: string;
  work_order_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
  };
  is_completed: boolean;
  completed_at: string | null;
  assigned_at: string;
  assigned_by: string | null;
}

export interface WorkOrderFile {
  id: string;
  work_order_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
  };
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

// 작업지시 댓글
export interface WorkOrderComment {
  id: string;
  work_order_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export type WorkOrderLogAction =
  | "created"
  | "edited"
  | "status_changed"
  | "assignee_added"
  | "assignee_removed"
  | "assignee_completed"
  | "file_added"
  | "file_removed"
  | "deadline_changed"
  | "comment_added"
  | "comment_edited"
  | "comment_deleted";

export interface WorkOrderLog {
  id: string;
  work_order_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
  };
  action: WorkOrderLogAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
}

// 제품/재고 관련 타입
export type ProductType = "finished" | "raw_material" | "purchased";

export interface Product {
  id: string;
  internal_code: string;
  internal_name: string;
  type: ProductType;
  category: string | null;
  spec: string | null;
  unit: string;
  description: string | null;
  current_stock: number;
  min_stock_alert: number | null;
  unit_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // 조인된 데이터
  materials?: ProductMaterial[];
  aliases?: CompanyProductAlias[];
}

export type AliasType = "purchase" | "sales";

export interface CompanyProductAlias {
  id: string;
  company_id: string;
  company?: {
    id: string;
    name: string;
  };
  product_id: string;
  alias_type: AliasType;
  external_code: string | null;
  external_name: string;
  external_spec: string | null;
  external_unit: string | null;
  external_unit_price: number | null;
  is_default: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMaterial {
  id: string;
  product_id: string;
  material_id: string;
  material?: Product;
  quantity_required: number;
  notes: string | null;
  created_at: string;
}

// 생산 기록 관련 타입
export type ProductionStatus = "completed" | "canceled";

export interface ProductionRecord {
  id: string;
  product_id: string;
  product?: Product;
  quantity_produced: number;
  production_date: string;
  batch_number: string | null;
  notes: string | null;
  status: ProductionStatus;
  created_at: string;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
  };
  canceled_at: string | null;
  canceled_by: string | null;
  cancel_reason: string | null;
  // 조인된 데이터
  consumptions?: ProductionConsumption[];
}

export interface ProductionConsumption {
  id: string;
  production_record_id: string;
  material_id: string;
  material?: Product;
  quantity_consumed: number;
  unit_price_at_time: number | null;
  created_at: string;
}

// 재고 트랜잭션 타입
export type TransactionType = "inbound" | "outbound" | "production" | "adjustment";

export interface ProductTransaction {
  id: string;
  product_id: string;
  product?: Product;
  transaction_type: TransactionType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
  };
}

// API 요청/응답 타입
export interface CreateWorkOrderRequest {
  title: string;
  content?: string;
  deadline_type: DeadlineType;
  deadline_start?: string;
  deadline_end?: string;
  requester_id: string;
  completion_type: CompletionType;
  completion_threshold?: number;
  assignee_ids?: string[];
}

export interface UpdateWorkOrderRequest {
  title?: string;
  content?: string;
  deadline_type?: DeadlineType;
  deadline_start?: string | null;
  deadline_end?: string | null;
  completion_type?: CompletionType;
  completion_threshold?: number;
  status?: WorkOrderStatus;
  cancel_reason?: string;
}

export interface CreateProductRequest {
  internal_code: string;
  internal_name: string;
  type: ProductType;
  category?: string;
  spec?: string;
  unit?: string;
  description?: string;
  current_stock?: number;
  min_stock_alert?: number;
  unit_price?: number;
}

export interface UpdateProductRequest {
  internal_code?: string;
  internal_name?: string;
  type?: ProductType;
  category?: string | null;
  spec?: string | null;
  unit?: string;
  description?: string | null;
  min_stock_alert?: number | null;
  unit_price?: number | null;
  is_active?: boolean;
}

export interface CreateProductionRequest {
  product_id: string;
  quantity_produced: number;
  production_date: string;
  batch_number?: string;
  notes?: string;
  created_by?: string;
  consumptions: {
    material_id: string;
    quantity_consumed: number;
  }[];
}

export interface StockAdjustmentRequest {
  product_id: string;
  quantity: number; // 양수: 증가, 음수: 감소
  notes?: string;
}

// 필터 타입
export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  requester_id?: string;
  assignee_id?: string;
  search?: string;
}

export interface ProductFilters {
  type?: ProductType;
  category?: string;
  is_active?: boolean;
  search?: string;
  low_stock?: boolean;
}

export interface ProductionRecordFilters {
  product_id?: string;
  status?: ProductionStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// 단가 이력 타입
export type PriceType = "purchase" | "sales";

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  product?: {
    id: string;
    internal_name: string;
    internal_code: string;
  };
  company_id: string | null;
  company?: {
    id: string;
    name: string;
  };
  alias_id: string | null;
  price_type: PriceType;
  unit_price: number;
  previous_price: number | null;
  price_change: number | null;
  price_change_percent: number | null;
  spec: string | null;
  document_id: string | null;
  document_type: string | null;
  effective_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProductPriceHistoryStats {
  count: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  latestPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

// 회사별 제품 별칭 생성 요청
export interface CompanyProductAliasCreateRequest {
  company_id: string;
  product_id: string;
  alias_type: AliasType;
  external_code?: string;
  external_name: string;
  external_spec?: string;
  external_unit?: string;
  external_unit_price?: number;
}

// document_items 생성 요청
export interface DocumentItemCreateRequest {
  product_id?: string;
  name: string;
  spec?: string;
  quantity: string;
  unit?: string;
  unit_price: number;
  amount: number;
}

// 타입 별칭 (호환성)
export type WorkOrderFilter = WorkOrderFilters;
export type ProductFilter = ProductFilters;
export type ProductionRecordFilter = ProductionRecordFilters;
export type WorkOrderCreateRequest = CreateWorkOrderRequest;
export type ProductCreateRequest = CreateProductRequest;
export type ProductionRecordCreateRequest = CreateProductionRequest;
