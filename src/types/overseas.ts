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
  forwarder: string; // 포워딩업체/관세사
  notes?: string; // 비고
  created_at: string;
  updated_at?: string;
}

// 통관비용 폼 데이터
export interface CustomsCostFormData {
  company_id: string;
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
  forwarder: string;
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
