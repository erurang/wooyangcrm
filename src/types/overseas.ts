// 해외 문서 타입
export type OverseasDocumentType =
  | "PI" // Proforma Invoice (견적)
  | "OC" // Order Confirmation (주문 확인)
  | "remittance" // Remittance (송금내역)
  | "DN" // Debit Note (청구서)
  | "BL" // Bill of Lading (선하증권)
  | "CI" // Commercial Invoice (상업송장)
  | "PL"; // Packing List (포장명세)

// 통화 타입
export type CurrencyType = "KRW" | "USD" | "EUR" | "JPY" | "CNY" | "GBP";

// 인코텀즈 타입
export type IncotermsType =
  | "EXW"
  | "FCA"
  | "CPT"
  | "CIP"
  | "DAP"
  | "DPU"
  | "DDP"
  | "FAS"
  | "FOB"
  | "CFR"
  | "CIF";

// 운송 방법
export type ShippingMethodType = "air" | "sea" | "express";

// 해외 문서 타입 라벨
export const OVERSEAS_DOCUMENT_TYPE_LABELS: Record<
  OverseasDocumentType,
  string
> = {
  PI: "Proforma Invoice",
  OC: "Order Confirmation",
  remittance: "Remittance (송금내역)",
  DN: "Debit Note",
  BL: "Bill of Lading",
  CI: "Commercial Invoice",
  PL: "Packing List",
};

// 해외 문서 타입 한글 라벨
export const OVERSEAS_DOCUMENT_TYPE_LABELS_KR: Record<
  OverseasDocumentType,
  string
> = {
  PI: "견적 송장",
  OC: "주문 확인서",
  remittance: "송금내역",
  DN: "청구서",
  BL: "선하증권",
  CI: "상업 송장",
  PL: "포장 명세서",
};

// 통화 라벨
export const CURRENCY_LABELS: Record<CurrencyType, string> = {
  KRW: "원화 (KRW)",
  USD: "미국 달러 (USD)",
  EUR: "유로 (EUR)",
  JPY: "일본 엔 (JPY)",
  CNY: "중국 위안 (CNY)",
  GBP: "영국 파운드 (GBP)",
};

// 통화 기호
export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  KRW: "₩",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  GBP: "£",
};

// 인코텀즈 라벨
export const INCOTERMS_LABELS: Record<IncotermsType, string> = {
  EXW: "EXW (공장인도)",
  FCA: "FCA (운송인인도)",
  CPT: "CPT (운송비지급인도)",
  CIP: "CIP (운송비보험료지급인도)",
  DAP: "DAP (도착장소인도)",
  DPU: "DPU (도착지양하인도)",
  DDP: "DDP (관세지급인도)",
  FAS: "FAS (선측인도)",
  FOB: "FOB (본선인도)",
  CFR: "CFR (운임포함인도)",
  CIF: "CIF (운임보험료포함인도)",
};

// 운송 방법 라벨
export const SHIPPING_METHOD_LABELS: Record<ShippingMethodType, string> = {
  air: "항공",
  sea: "해상",
  express: "특송",
};

// 해외 상담 필드 인터페이스
export interface OverseasConsultationFields {
  shipping_date?: string;
  incoterms?: IncotermsType;
  lc_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
}

// 통관비용 항목 인터페이스
export interface CustomsCost {
  id: string;
  company_id: string;
  company_name?: string;
  consultation_id?: string; // 연결된 해외 상담 ID
  consultation?: OverseasConsultation; // 연결된 해외 상담 정보
  clearance_date: string; // 통관일 (세금계산서 날짜)
  invoice_no: string; // Invoice No.
  air_freight: number; // 항공료
  sea_freight: number; // 해상료
  customs_duty: number; // 관세
  port_charges: number; // 포트발생비용/통관수수료/창고세/핸들링비
  domestic_transport: number; // 내국운송료
  express_freight: number; // 특송운임
  subtotal: number; // 총계(VAT제외)
  vat: number; // 부가세
  total: number; // 총계(VAT포함)
  shipping_method: ShippingMethodType; // 운송방법
  shipping_carrier_id?: string; // 운송업체 ID
  shipping_carrier?: ShippingCarrier; // 운송업체 정보
  forwarder?: string; // 포워딩업체/관세사 (레거시, 선택적)
  notes?: string; // 비고
  created_at: string;
  updated_at?: string;
}

// 통관비용 폼 데이터
export interface CustomsCostFormData {
  company_id: string;
  consultation_id: string; // 연결된 해외 상담 ID
  clearance_date: string;
  invoice_no: string;
  air_freight: number | "";
  sea_freight: number | "";
  customs_duty: number | "";
  port_charges: number | "";
  domestic_transport: number | "";
  express_freight: number | "";
  vat: number | "";
  shipping_method: ShippingMethodType;
  shipping_carrier_id: string; // 운송업체 ID
  notes: string;
}

// 통관비용 통계
export interface CustomsCostStats {
  period: string; // YYYY-MM or YYYY
  total_count: number;
  total_air_freight: number;
  total_sea_freight: number;
  total_customs_duty: number;
  total_port_charges: number;
  total_domestic_transport: number;
  total_express_freight: number;
  total_subtotal: number;
  total_vat: number;
  total_amount: number;
}

// 해외 거래처 담당자 인터페이스
export interface OverseasContact {
  id?: string;
  name: string;
  email?: string;
  mobile?: string;
  department?: string;
  position?: string;
}

// 해외 거래처 인터페이스
export interface OverseasCompany {
  id: string;
  name: string;
  address?: string;
  email?: string;
  website?: string;
  notes?: string;
  contacts?: OverseasContact[];
  is_overseas: true;
  created_at: string;
}

// 해외 문서 인터페이스
export interface OverseasDocument {
  id: string;
  overseas_type: OverseasDocumentType;
  currency: CurrencyType;
  document_number: string;
  company_id: string;
  company_name?: string;
  content: {
    items: {
      name: string;
      spec: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }[];
    total_amount: number;
  };
  status: string;
  created_at: string;
}

// 수입/수출 구분
export type OrderType = "import" | "export";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  import: "수입 (발주)",
  export: "수출",
};

// 거래 상태
export type TradeStatus = "ordered" | "production_complete" | "shipped" | "in_transit" | "arrived";

export const TRADE_STATUS_LABELS: Record<TradeStatus, string> = {
  ordered: "발주함",
  production_complete: "생산완료",
  shipped: "출고됨",
  in_transit: "운송중",
  arrived: "입고완료",
};

export const TRADE_STATUS_COLORS: Record<TradeStatus, string> = {
  ordered: "bg-slate-100 text-slate-700 border-slate-300",
  production_complete: "bg-amber-50 text-amber-700 border-amber-300",
  shipped: "bg-blue-50 text-blue-700 border-blue-300",
  in_transit: "bg-purple-50 text-purple-700 border-purple-300",
  arrived: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

// 상태 순서 (칸반용)
export const TRADE_STATUS_ORDER: TradeStatus[] = [
  "ordered",
  "production_complete",
  "shipped",
  "in_transit",
  "arrived",
];

// 발주 품목 인터페이스
export interface OverseasOrderItem {
  id?: string;
  name: string; // 품명
  spec: string; // 규격
  quantity: string | number; // 수량 (예: "10", "50박스", "100EA")
  unit_price: number; // 단가
  amount: number; // 금액
}

// 발주 첨부파일 인터페이스
export interface OverseasOrderFile {
  id: string;
  order_id: string;
  file_name: string;
  file_url: string;
  file_type: OverseasDocumentType | "other"; // PI, OC, BL, CI, PL 등
  file_size?: number;
  uploaded_at: string;
}

// 수입품 발주 인터페이스
export interface OverseasOrder {
  id: string;
  company_id: string;
  company_name?: string;
  order_type: OrderType; // 수입/수출 구분
  invoice_no: string; // Invoice No.
  order_date: string; // 발주일
  shipment_date?: string; // 출고일 (해외거래처에서)
  arrival_date?: string; // 입고일 (우리회사)
  currency: CurrencyType; // 통화
  items: OverseasOrderItem[]; // 품목 리스트
  total_amount: number; // 총금액 (외화)
  remittance_amount?: number; // 총송금액
  remittance_date?: string; // 송금일
  exchange_rate?: number; // 환율
  krw_amount?: number; // 원화환산액
  shipping_method?: ShippingMethodType; // 운송방법
  forwarder?: string; // 운송업체/관세사
  hs_code?: string; // H.S.code
  tariff_rate?: number; // 관세율 (%)
  contact_name?: string; // 상대 담당자 (거래처)
  user_id?: string; // 오더 담당자 ID (우리측)
  user_name?: string; // 오더 담당자명
  notes?: string; // 비고
  files?: OverseasOrderFile[]; // 첨부파일
  created_at: string;
  updated_at?: string;
}

// 발주 폼 데이터
export interface OverseasOrderFormData {
  id?: string; // 수정 시 필요
  company_id: string;
  order_type: OrderType;
  invoice_no: string;
  order_date: string;
  shipment_date: string;
  arrival_date: string;
  currency: CurrencyType;
  items: OverseasOrderItem[];
  remittance_amount: number | "";
  remittance_date: string;
  exchange_rate: number | "";
  shipping_method: ShippingMethodType | "";
  forwarder: string;
  hs_code: string;
  tariff_rate: number | "";
  contact_name: string; // 상대 담당자 (거래처)
  user_id: string; // 오더 담당자 ID (우리측)
  notes: string;
}

// ========================================
// 해외 상담 관련 타입
// ========================================

// 해외 상담 첨부파일 타입
export type OverseasFileType =
  | "PI"          // Proforma Invoice (견적송장)
  | "CI"          // Commercial Invoice (상업송장)
  | "PL"          // Packing List (포장명세서)
  | "BL"          // Bill of Lading (선하증권)
  | "AWB"         // Air Waybill (항공화물운송장)
  | "CO"          // Certificate of Origin (원산지증명서)
  | "LC"          // Letter of Credit (신용장)
  | "REMITTANCE"  // Remittance Details (송금내역)
  | "CONTRACT"    // 계약서
  | "CATALOG"     // 카탈로그
  | "OTHER";      // 기타

// 파일 타입 라벨
export const OVERSEAS_FILE_TYPE_LABELS: Record<OverseasFileType, string> = {
  PI: "Proforma Invoice",
  CI: "Commercial Invoice",
  PL: "Packing List",
  BL: "Bill of Lading",
  AWB: "Air Waybill",
  CO: "Certificate of Origin",
  LC: "Letter of Credit",
  REMITTANCE: "Remittance Details (송금내역)",
  CONTRACT: "계약서",
  CATALOG: "카탈로그",
  OTHER: "기타",
};

// 해외 상담 첨부파일 인터페이스
export interface OverseasConsultationFile {
  id: string;
  consultation_id: string;
  file_name: string;
  file_url: string;
  file_type: OverseasFileType;
  file_size: number;
  uploaded_by?: string;
  uploaded_at: string;
}

// 포장 타입
export type PackagingType = "pallet" | "box" | "other";

export const PACKAGING_TYPE_LABELS: Record<PackagingType, string> = {
  pallet: "Pallet",
  box: "Box",
  other: "기타",
};

// 운송업체 인터페이스
export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  sort_order: number;
}

// 해외 상담 인터페이스
export interface OverseasConsultation {
  id: string;
  company_id: string;
  company_name?: string;
  order_type?: OrderType;          // 수입/수출 구분
  date: string;                    // 상담일
  title?: string;                  // 제목
  content: string;                 // 상담 내용
  contact_id?: string;             // 거래처 담당자 ID
  contact_name?: string;           // 거래처 담당자명 (조회용)
  user_id?: string;                // 작성자 ID
  user_name?: string;              // 작성자명
  files?: OverseasConsultationFile[]; // 첨부파일
  created_at: string;
  updated_at?: string;

  // 분할 배송 관련 필드
  parent_consultation_id?: string; // 원본 상담 ID (분할 배송인 경우)
  split_number?: number;           // 분할 번호 (1, 2, 3...)
  split_consultations?: OverseasConsultation[]; // 하위 분할 배송 목록

  // 거래 정보 필드
  order_date?: string;             // 발주일
  expected_completion_date?: string; // 생산완료예정일
  pickup_date?: string;            // 출고일 (pick-up)
  arrival_date?: string;           // 입고일
  oc_number?: string;              // O/C No. [invoice No.]
  product_name?: string;           // 품명
  specification?: string;          // 규격(DN)
  quantity?: string;               // 수량
  total_remittance?: number;       // 총송금액
  currency?: CurrencyType;         // 통화 (KRW, EUR, USD, CNY)
  remittance_date?: string;        // 송금일
  shipping_method?: ShippingMethodType; // 운송 (air, sea, express)
  shipping_carrier_id?: string;    // 운송업체 ID (FK to shipping_carriers)
  shipping_carrier?: ShippingCarrier; // 운송업체 정보 (조인용)
  incoterms?: IncotermsType;       // 인코텀즈
  trade_status?: TradeStatus;        // 거래 상태
  packaging_width?: number;        // 포장 - 가로(cm)
  packaging_height?: number;       // 포장 - 세로(cm)
  packaging_depth?: number;        // 포장 - 높이(cm)
  packaging_type?: PackagingType;  // 포장 타입 (pallet, box, etc.)
  packaging_weight?: number;       // 무게 (kg)
  remarks?: string;                // 비고
}

// 해외 상담 폼 데이터
export interface OverseasConsultationFormData {
  id?: string;
  company_id: string;
  order_type: OrderType | "";      // 수입/수출 구분
  date: string;
  title: string;                   // 제목
  content: string;
  contact_id: string;  // 담당자 ID (contacts_consultations 중간 테이블 연결)
  user_id: string;

  // 거래 정보 필드
  order_date: string;              // 발주일
  expected_completion_date: string; // 생산완료예정일
  pickup_date: string;             // 출고일 (pick-up)
  arrival_date: string;            // 입고일
  oc_number: string;               // O/C No. [invoice No.]
  product_name: string;            // 품명
  specification: string;           // 규격(DN)
  quantity: string;                // 수량
  total_remittance: number | "";   // 총송금액
  currency: CurrencyType | "";     // 통화 (KRW, EUR, USD, CNY)
  remittance_date: string;         // 송금일
  shipping_method: ShippingMethodType | "";  // 운송 (air, sea, express)
  shipping_carrier_id: string;     // 운송업체 ID
  incoterms: IncotermsType | "";   // 인코텀즈
  trade_status: TradeStatus | "";  // 거래 상태
  packaging_width: number | "";    // 포장 - 가로(cm)
  packaging_height: number | "";   // 포장 - 세로(cm)
  packaging_depth: number | "";    // 포장 - 높이(cm)
  packaging_type: PackagingType | "";  // 포장 타입 (pallet, box, etc.)
  packaging_weight: number | "";   // 무게 (kg)
  remarks: string;                 // 비고
}

// 해외 상담 상세 (파일 포함)
export interface OverseasConsultationDetail extends OverseasConsultation {
  files: OverseasConsultationFile[];
}
