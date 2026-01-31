// 배송 추적 타입

// 택배사 타입
export type CarrierType = "fedex" | "sne" | "domestic" | "logen" | "kyungdong";

export const CARRIER_LABELS: Record<CarrierType, string> = {
  fedex: "FedEx",
  sne: "SNE",
  domestic: "국내택배",
  logen: "로젠택배",
  kyungdong: "경동택배",
};

// 국내 택배사 코드 (스마트택배 API 기준)
export type DomesticCarrierCode =
  | "04"  // CJ대한통운
  | "06"  // 로젠택배
  | "05"  // 한진택배
  | "08"  // 롯데택배
  | "01"  // 우체국택배
  | "23"; // 경동택배

export const DOMESTIC_CARRIER_LABELS: Record<DomesticCarrierCode, string> = {
  "04": "CJ대한통운",
  "06": "로젠택배",
  "05": "한진택배",
  "08": "롯데택배",
  "01": "우체국택배",
  "23": "경동택배",
};

// 배송 상태
export type ShippingStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "unknown";

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  pending: "접수 대기",
  picked_up: "픽업 완료",
  in_transit: "운송 중",
  out_for_delivery: "배송 출발",
  delivered: "배송 완료",
  exception: "예외 발생",
  unknown: "알 수 없음",
};

// 배송 추적 레코드 (DB 저장용)
export interface ShippingTracking {
  id: string;
  order_id?: string; // overseas_orders 연결 (선택)
  order_type?: "overseas_order" | "outbound"; // 연결된 주문 타입
  company_id?: string; // 연결된 거래처 ID
  company?: { id: string; name: string }; // 거래처 정보 (조인)
  carrier: CarrierType;
  carrier_code?: DomesticCarrierCode; // 국내택배 상세 코드
  tracking_number: string;
  origin?: string; // 출발지
  destination?: string; // 도착지
  status: ShippingStatus;
  eta?: string; // 예상 도착일
  last_checked?: string; // 마지막 조회 시간
  memo?: string; // 메모
  created_by?: string; // 등록자 ID
  created_at: string;
  updated_at?: string;
  // 캐싱 관련 (배송완료 건)
  cached_result?: Record<string, unknown>; // 배송완료 시 조회 결과 캐시
  is_completed?: boolean; // 배송완료 여부
  completed_at?: string; // 배송완료 시각
}

// 배송 추적 폼 데이터
export interface ShippingTrackingFormData {
  carrier: CarrierType;
  carrier_code?: DomesticCarrierCode; // 국내택배 상세 코드
  tracking_number: string;
  order_id?: string;
  order_type?: "overseas_order" | "outbound";
  company_id?: string; // 연결할 거래처 ID
  origin?: string;
  destination?: string;
  memo?: string;
}

// 배송 타임라인 이벤트
export interface ShippingTimelineEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

// FedEx API 응답 (조회 결과)
export interface FedExShipmentResult {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  shipDate: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  service: string;
  weight?: string;
}
