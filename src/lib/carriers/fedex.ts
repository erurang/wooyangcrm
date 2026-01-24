// FedEx Track API
// https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html

import type {
  TrackingResult,
  TrackingEvent,
  PartyInfo,
  PackageInfo,
  ServiceInfo,
  DateInfo
} from "./index";
import { getStatusText } from "./index";

interface FedExTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// 배송 리스트 아이템
export interface FedExShipment {
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

interface FedExAddress {
  city?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  countryCode?: string;
  countryName?: string;
  streetLines?: string[];
  residential?: boolean;
}

interface FedExContact {
  companyName?: string;
  personName?: string;
  phoneNumber?: string;
}

interface FedExLocationContactAndAddress {
  contact?: FedExContact;
  address?: FedExAddress;
}

interface FedExLocation {
  locationContactAndAddress?: FedExLocationContactAndAddress;
}

interface FedExWeight {
  value?: string;
  unit?: string;
}

interface FedExDimension {
  length?: number;
  width?: number;
  height?: number;
  units?: string;
}

interface FedExPackageDetails {
  physicalPackagingType?: string;
  packagingDescription?: {
    description?: string;
    type?: string;
  };
  sequenceNumber?: string;
  count?: string;
  weightAndDimensions?: {
    weight?: FedExWeight[];
    dimensions?: FedExDimension[];
  };
}

interface FedExTrackResponse {
  output?: {
    completeTrackResults: Array<{
      trackingNumber: string;
      trackResults: Array<{
        trackingNumberInfo: {
          trackingNumber: string;
          carrierCode?: string;
        };
        latestStatusDetail: {
          code: string;
          description: string;
          statusByLocale: string;
          ancillaryDetails?: Array<{
            reason?: string;
            reasonDetail?: string;
          }>;
        };
        serviceDetail?: {
          type?: string;
          description?: string;
        };
        dateAndTimes?: Array<{
          type: string;
          dateTime: string;
        }>;
        availableImages?: Array<{
          type: string;
          url?: string;
        }>;
        deliveryDetails?: {
          receivedByName?: string;
          deliveryAttempts?: string;
          destinationServiceArea?: string;
          actualDeliveryAddress?: FedExAddress;
          deliveryOptionEligibilityDetails?: Array<{
            option?: string;
            eligibility?: string;
          }>;
        };
        originLocation?: FedExLocation;
        destinationLocation?: FedExLocation;
        recipientInformation?: FedExLocationContactAndAddress;
        shipperInformation?: FedExLocationContactAndAddress;
        packageDetails?: FedExPackageDetails;
        shipmentDetails?: {
          possessionStatus?: string;
          weight?: FedExWeight[];
        };
        scanEvents?: Array<{
          date: string;
          eventType: string;
          eventDescription: string;
          exceptionCode?: string;
          exceptionDescription?: string;
          scanLocation?: {
            city?: string;
            stateOrProvinceCode?: string;
            countryCode?: string;
            countryName?: string;
          };
          derivedStatus?: string;
        }>;
        error?: {
          code?: string;
          message?: string;
        };
      }>;
    }>;
  };
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

// FedEx 상태 코드 -> 내부 상태 매핑
function mapFedExStatus(code: string): TrackingResult["status"] {
  const statusMap: Record<string, TrackingResult["status"]> = {
    PU: "picked_up", // Picked Up
    IT: "in_transit", // In Transit
    OD: "out_for_delivery", // Out for Delivery
    DL: "delivered", // Delivered
    DP: "in_transit", // Departed
    AR: "in_transit", // Arrived
    CA: "unknown", // Cancelled
    DE: "unknown", // Delay
  };
  return statusMap[code] || "in_transit";
}

// 액세스 토큰 가져오기
async function getFedExToken(): Promise<string | null> {
  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("FedEx API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      "https://apis.fedex.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    const data: FedExTokenResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to get FedEx token:", error);
    return null;
  }
}

/**
 * FedEx API로 배송 조회
 */
export async function trackWithFedEx(
  trackingNumber: string
): Promise<TrackingResult> {
  const token = await getFedExToken();

  if (!token) {
    return {
      success: false,
      trackingNumber,
      carrier: "fedex",
      carrierName: "FedEx",
      status: "unknown",
      statusText: "API 키 미설정",
      timeline: [],
      error: "FedEx API 인증 정보가 설정되지 않았습니다.",
    };
  }

  try {
    const response = await fetch(
      "https://apis.fedex.com/track/v1/trackingnumbers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          includeDetailedScans: true,
          trackingInfo: [
            {
              trackingNumberInfo: {
                trackingNumber,
              },
            },
          ],
        }),
      }
    );

    const data: FedExTrackResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      return {
        success: false,
        trackingNumber,
        carrier: "fedex",
        carrierName: "FedEx",
        status: "unknown",
        statusText: "조회 실패",
        timeline: [],
        error: data.errors[0].message,
      };
    }

    const trackResult = data.output?.completeTrackResults?.[0]?.trackResults?.[0];

    if (!trackResult) {
      return {
        success: false,
        trackingNumber,
        carrier: "fedex",
        carrierName: "FedEx",
        status: "unknown",
        statusText: "조회 실패",
        timeline: [],
        error: "송장 정보를 찾을 수 없습니다.",
      };
    }

    const status = mapFedExStatus(trackResult.latestStatusDetail.code);

    // 날짜 정보 추출
    const getDateByType = (type: string) =>
      trackResult.dateAndTimes?.find((d) => d.type === type)?.dateTime?.split("T")[0];

    const getFullDateTimeByType = (type: string) =>
      trackResult.dateAndTimes?.find((d) => d.type === type)?.dateTime;

    // 시간 포맷팅 헬퍼 (ISO -> 로컬 시간)
    const formatTime = (isoDateTime?: string) => {
      if (!isoDateTime) return undefined;
      try {
        const date = new Date(isoDateTime);
        return date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });
      } catch {
        return undefined;
      }
    };

    // 배송 시간대 계산
    const windowStart = getFullDateTimeByType("ESTIMATED_DELIVERY_WINDOW_BEGIN");
    const windowEnd = getFullDateTimeByType("ESTIMATED_DELIVERY_WINDOW_END");
    const commitDateTime = getFullDateTimeByType("COMMIT");

    let estimatedDeliveryTime: string | undefined;
    if (windowStart && windowEnd) {
      const startTime = formatTime(windowStart);
      const endTime = formatTime(windowEnd);
      if (startTime && endTime) {
        estimatedDeliveryTime = `${startTime} ~ ${endTime}`;
      }
    } else if (commitDateTime) {
      const commitTime = formatTime(commitDateTime);
      if (commitTime) {
        estimatedDeliveryTime = `${commitTime} 이전`;
      }
    }

    const dateInfo: DateInfo = {
      shipDate: getDateByType("SHIP"),
      estimatedDelivery: getDateByType("ESTIMATED_DELIVERY") || getDateByType("COMMIT"),
      estimatedDeliveryTime,
      estimatedDeliveryWindowStart: windowStart,
      estimatedDeliveryWindowEnd: windowEnd,
      commitDate: getDateByType("COMMIT"),
      actualDelivery: getDateByType("ACTUAL_DELIVERY"),
      pickupDate: getDateByType("PICKUP"),
    };

    const eta = dateInfo.estimatedDelivery;

    // 발송자 정보
    const shipperInfo = trackResult.shipperInformation || trackResult.originLocation?.locationContactAndAddress;
    const shipper: PartyInfo | undefined = shipperInfo ? {
      contact: shipperInfo.contact ? {
        companyName: shipperInfo.contact.companyName,
        personName: shipperInfo.contact.personName,
        phoneNumber: shipperInfo.contact.phoneNumber,
      } : undefined,
      address: shipperInfo.address ? {
        city: shipperInfo.address.city,
        stateOrProvince: shipperInfo.address.stateOrProvinceCode,
        postalCode: shipperInfo.address.postalCode,
        countryCode: shipperInfo.address.countryCode,
        countryName: shipperInfo.address.countryName,
        streetLines: shipperInfo.address.streetLines,
      } : undefined,
    } : undefined;

    // 수취인 정보
    const recipientInfo = trackResult.recipientInformation || trackResult.destinationLocation?.locationContactAndAddress;
    const recipient: PartyInfo | undefined = recipientInfo ? {
      contact: recipientInfo.contact ? {
        companyName: recipientInfo.contact.companyName,
        personName: recipientInfo.contact.personName,
        phoneNumber: recipientInfo.contact.phoneNumber,
      } : undefined,
      address: recipientInfo.address ? {
        city: recipientInfo.address.city,
        stateOrProvince: recipientInfo.address.stateOrProvinceCode,
        postalCode: recipientInfo.address.postalCode,
        countryCode: recipientInfo.address.countryCode,
        countryName: recipientInfo.address.countryName,
        streetLines: recipientInfo.address.streetLines,
      } : undefined,
    } : undefined;

    // 패키지 정보
    const pkgDetails = trackResult.packageDetails;
    const packageInfo: PackageInfo | undefined = pkgDetails ? {
      count: pkgDetails.count ? parseInt(pkgDetails.count) : undefined,
      weight: pkgDetails.weightAndDimensions?.weight?.[0]
        ? `${pkgDetails.weightAndDimensions.weight[0].value} ${pkgDetails.weightAndDimensions.weight[0].unit}`
        : undefined,
      dimensions: pkgDetails.weightAndDimensions?.dimensions?.[0]
        ? `${pkgDetails.weightAndDimensions.dimensions[0].length}x${pkgDetails.weightAndDimensions.dimensions[0].width}x${pkgDetails.weightAndDimensions.dimensions[0].height} ${pkgDetails.weightAndDimensions.dimensions[0].units}`
        : undefined,
      packagingDescription: pkgDetails.packagingDescription?.description || pkgDetails.physicalPackagingType,
      sequenceNumber: pkgDetails.sequenceNumber,
    } : undefined;

    // 서비스 정보
    const serviceInfo: ServiceInfo | undefined = trackResult.serviceDetail ? {
      type: trackResult.serviceDetail.type,
      description: trackResult.serviceDetail.description,
    } : undefined;

    // 배송 완료시 서명자 정보
    const signedBy = trackResult.deliveryDetails?.receivedByName;
    const deliveryLocation = trackResult.deliveryDetails?.actualDeliveryAddress
      ? `${trackResult.deliveryDetails.actualDeliveryAddress.city || ""}, ${trackResult.deliveryDetails.actualDeliveryAddress.countryCode || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, "")
      : undefined;

    // 타임라인 변환 및 최신순 정렬
    const timeline: TrackingEvent[] = (trackResult.scanEvents || [])
      .map((event) => {
        const dateTime = new Date(event.date);
        const location = event.scanLocation
          ? `${event.scanLocation.city || ""}, ${event.scanLocation.countryCode || ""}`.replace(/^,\s*/, "").replace(/,\s*$/, "")
          : "";

        return {
          date: dateTime.toISOString().split("T")[0],
          time: dateTime.toTimeString().slice(0, 5),
          status: mapFedExStatus(event.eventType) as string,
          location,
          description: event.eventDescription,
          _sortKey: dateTime.getTime(), // 정렬용 임시 키
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey) // 최신순 정렬
      .map(({ _sortKey, ...rest }) => rest); // 임시 키 제거

    return {
      success: true,
      trackingNumber,
      carrier: "fedex",
      carrierName: "FedEx",
      status,
      statusText: trackResult.latestStatusDetail.statusByLocale || getStatusText(status),
      eta,
      timeline,
      shipper,
      recipient,
      packageInfo,
      serviceInfo,
      dateInfo,
      signedBy,
      deliveryLocation,
    };
  } catch (error) {
    console.error("FedEx API error:", error);
    return {
      success: false,
      trackingNumber,
      carrier: "fedex",
      carrierName: "FedEx",
      status: "unknown",
      statusText: "조회 오류",
      timeline: [],
      error: "배송 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * FedEx 계정의 최근 배송 리스트 조회
 * Track by References API 사용
 * SHIPPER(수출) + RECIPIENT(수입) 둘 다 조회
 */
export async function getFedExShipmentsByAccount(
  days: number = 30
): Promise<{ success: boolean; shipments: FedExShipment[]; error?: string }> {
  const token = await getFedExToken();
  const accountNumber = process.env.FEDEX_ACCOUNT_NUMBER;

  if (!token) {
    return {
      success: false,
      shipments: [],
      error: "FedEx API 인증 정보가 설정되지 않았습니다.",
    };
  }

  if (!accountNumber) {
    return {
      success: false,
      shipments: [],
      error: "FedEx 계정 번호가 설정되지 않았습니다.",
    };
  }

  try {
    // 날짜 범위 설정
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // 수출(SHIPPER) + 수입(RECIPIENT) + 결제자(PAYOR) + 제3자(THIRD_PARTY) 조회
    const accountTypes = ["SHIPPER", "RECIPIENT", "PAYOR", "THIRD_PARTY"];
    const allShipments: FedExShipment[] = [];

    for (const accountType of accountTypes) {
      console.log(`Fetching FedEx shipments as ${accountType}...`);

      const response = await fetch(
        "https://apis.fedex.com/track/v1/trackingnumbers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-locale": "ko_KR",
          },
          body: JSON.stringify({
            includeDetailedScans: false,
            trackingInfo: [
              {
                shipDateBegin: formatDate(startDate),
                shipDateEnd: formatDate(endDate),
                accountNumber: {
                  type: accountType,
                  value: accountNumber,
                },
              },
            ],
          }),
        }
      );

      const data = await response.json();
      console.log(`FedEx API Response (${accountType}):`, JSON.stringify(data, null, 2));

      if (data.errors && data.errors.length > 0) {
        console.error(`FedEx API errors (${accountType}):`, data.errors);
      }

      // completeTrackResults에서 배송 정보 추출
      const trackResults = data.output?.completeTrackResults || [];

      for (const result of trackResults) {
        for (const track of result.trackResults || []) {
          const trackingNumber = track.trackingNumberInfo?.trackingNumber || result.trackingNumber;

          if (!trackingNumber) continue;

          // 중복 체크
          if (allShipments.some(s => s.trackingNumber === trackingNumber)) continue;

          const shipDate = track.dateAndTimes?.find((d: any) => d.type === "SHIP")?.dateTime;
          const estimatedDelivery = track.dateAndTimes?.find((d: any) => d.type === "ESTIMATED_DELIVERY")?.dateTime;
          const actualDelivery = track.dateAndTimes?.find((d: any) => d.type === "ACTUAL_DELIVERY")?.dateTime;

          const originAddress = track.originLocation?.locationContactAndAddress?.address || {};
          const destAddress = track.destinationLocation?.locationContactAndAddress?.address || {};

          allShipments.push({
            trackingNumber,
            status: track.latestStatusDetail?.code || "UNKNOWN",
            statusDescription: track.latestStatusDetail?.statusByLocale || track.latestStatusDetail?.description || "알 수 없음",
            shipDate: shipDate?.split("T")[0] || "",
            estimatedDelivery: estimatedDelivery?.split("T")[0],
            actualDelivery: actualDelivery?.split("T")[0],
            origin: {
              city: originAddress.city || "",
              country: originAddress.countryCode || "",
            },
            destination: {
              city: destAddress.city || "",
              country: destAddress.countryCode || "",
            },
            service: track.serviceDetail?.description || track.serviceType || "",
            weight: track.packageDetails?.weightAndDimensions?.weight?.[0]?.value
              ? `${track.packageDetails.weightAndDimensions.weight[0].value} ${track.packageDetails.weightAndDimensions.weight[0].unit}`
              : undefined,
          });
        }
      }
    }

    return {
      success: true,
      shipments: allShipments,
    };
  } catch (error) {
    console.error("FedEx API error:", error);
    return {
      success: false,
      shipments: [],
      error: "배송 목록 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 여러 송장번호 한번에 조회
 */
export async function trackMultipleFedEx(
  trackingNumbers: string[]
): Promise<{ success: boolean; shipments: FedExShipment[]; error?: string }> {
  const token = await getFedExToken();

  if (!token) {
    return {
      success: false,
      shipments: [],
      error: "FedEx API 인증 정보가 설정되지 않았습니다.",
    };
  }

  if (trackingNumbers.length === 0) {
    return { success: true, shipments: [] };
  }

  try {
    const response = await fetch(
      "https://apis.fedex.com/track/v1/trackingnumbers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-locale": "ko_KR",
        },
        body: JSON.stringify({
          includeDetailedScans: false,
          trackingInfo: trackingNumbers.map((num) => ({
            trackingNumberInfo: {
              trackingNumber: num,
            },
          })),
        }),
      }
    );

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error("FedEx API errors:", data.errors);
    }

    const shipments: FedExShipment[] = [];
    const trackResults = data.output?.completeTrackResults || [];

    for (const result of trackResults) {
      for (const track of result.trackResults || []) {
        const trackingNumber = track.trackingNumberInfo?.trackingNumber || result.trackingNumber;

        if (!trackingNumber) continue;

        const shipDate = track.dateAndTimes?.find((d: any) => d.type === "SHIP")?.dateTime;
        const estimatedDelivery = track.dateAndTimes?.find((d: any) => d.type === "ESTIMATED_DELIVERY")?.dateTime;
        const actualDelivery = track.dateAndTimes?.find((d: any) => d.type === "ACTUAL_DELIVERY")?.dateTime;

        const originAddress = track.originLocation?.locationContactAndAddress?.address || {};
        const destAddress = track.destinationLocation?.locationContactAndAddress?.address || {};

        shipments.push({
          trackingNumber,
          status: track.latestStatusDetail?.code || "UNKNOWN",
          statusDescription: track.latestStatusDetail?.statusByLocale || track.latestStatusDetail?.description || "알 수 없음",
          shipDate: shipDate?.split("T")[0] || "",
          estimatedDelivery: estimatedDelivery?.split("T")[0],
          actualDelivery: actualDelivery?.split("T")[0],
          origin: {
            city: originAddress.city || "",
            country: originAddress.countryCode || "",
          },
          destination: {
            city: destAddress.city || "",
            country: destAddress.countryCode || "",
          },
          service: track.serviceDetail?.description || track.serviceType || "",
          weight: track.packageDetails?.weightAndDimensions?.weight?.[0]?.value
            ? `${track.packageDetails.weightAndDimensions.weight[0].value} ${track.packageDetails.weightAndDimensions.weight[0].unit}`
            : undefined,
        });
      }
    }

    return {
      success: true,
      shipments,
    };
  } catch (error) {
    console.error("FedEx API error:", error);
    return {
      success: false,
      shipments: [],
      error: "배송 조회 중 오류가 발생했습니다.",
    };
  }
}
