// 택배사 통합 인터페이스

export type CarrierCode = "logen" | "kyungdong" | "fedex" | "sne";

export interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

// 주소 정보
export interface AddressInfo {
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  streetLines?: string[];
}

// 연락처 정보
export interface ContactInfo {
  companyName?: string;
  personName?: string;
  phoneNumber?: string;
}

// 발송자/수취인 정보
export interface PartyInfo {
  contact?: ContactInfo;
  address?: AddressInfo;
}

// 패키지 상세 정보
export interface PackageInfo {
  count?: number;
  weight?: string;
  dimensions?: string;
  packagingDescription?: string;
  sequenceNumber?: string;
}

// 서비스 정보
export interface ServiceInfo {
  type?: string;
  description?: string;
}

// 배송 일자 정보
export interface DateInfo {
  shipDate?: string;
  estimatedDelivery?: string;
  estimatedDeliveryTime?: string; // 예상 배송 시간 (예: "9:30 AM~1:30 PM")
  estimatedDeliveryWindowStart?: string; // 예상 배송 시간대 시작
  estimatedDeliveryWindowEnd?: string; // 예상 배송 시간대 종료
  commitDate?: string; // 약속 배송일
  actualDelivery?: string;
  pickupDate?: string;
}

export interface TrackingResult {
  success: boolean;
  trackingNumber: string;
  carrier: CarrierCode;
  carrierName: string;
  status: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "unknown";
  statusText: string;
  eta?: string;
  timeline: TrackingEvent[];
  error?: string;
  // 출발지/도착지 (간단 표시용)
  origin?: string;
  destination?: string;
  // 확장 정보
  shipper?: PartyInfo;
  recipient?: PartyInfo;
  packageInfo?: PackageInfo;
  serviceInfo?: ServiceInfo;
  dateInfo?: DateInfo;
  signedBy?: string;
  deliveryLocation?: string;
}

// 택배사 정보
export const CARRIERS: Record<
  CarrierCode,
  { name: string; code: string; type: "domestic" | "international" }
> = {
  logen: { name: "로젠택배", code: "08", type: "domestic" },
  kyungdong: { name: "경동택배", code: "23", type: "domestic" },
  fedex: { name: "FedEx", code: "fedex", type: "international" },
  sne: { name: "SNE", code: "sne", type: "international" },
};

// 택배사 옵션 목록
export const CARRIER_OPTIONS = Object.entries(CARRIERS).map(([code, info]) => ({
  value: code,
  label: info.name,
  type: info.type,
}));

// 국내 택배사 옵션
export const DOMESTIC_CARRIER_OPTIONS = CARRIER_OPTIONS.filter(
  (c) => c.type === "domestic"
);

// 해외 택배사 옵션
export const INTERNATIONAL_CARRIER_OPTIONS = CARRIER_OPTIONS.filter(
  (c) => c.type === "international"
);

// 상태 매핑 (스마트택배 level -> 내부 상태)
export function mapSweetTrackerLevel(
  level: number
): TrackingResult["status"] {
  switch (level) {
    case 1:
      return "picked_up"; // 상품 인수
    case 2:
    case 3:
    case 4:
    case 5:
      return "in_transit"; // 배송 중
    case 6:
      return "delivered"; // 배송 완료
    default:
      return "unknown";
  }
}

// 상태 텍스트
export function getStatusText(status: TrackingResult["status"]): string {
  switch (status) {
    case "pending":
      return "접수 대기";
    case "picked_up":
      return "상품 인수";
    case "in_transit":
      return "배송 중";
    case "out_for_delivery":
      return "배송 출발";
    case "delivered":
      return "배송 완료";
    case "unknown":
    default:
      return "확인 중";
  }
}

// 상태 색상
export function getStatusColor(status: TrackingResult["status"]): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case "pending":
      return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    case "picked_up":
      return { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" };
    case "in_transit":
      return { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" };
    case "out_for_delivery":
      return { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" };
    case "delivered":
      return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
    case "unknown":
    default:
      return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  }
}
