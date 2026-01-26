// 한국수출입은행 환율 API
import https from "https";

// SSL 인증서 검증 우회 agent (한국수출입은행 API 인증서 체인 불완전 문제)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export interface ExchangeRateResponse {
  result: number; // 1: 성공, 2: DATA코드 오류, 3: 인증코드 오류, 4: 일별 제한 초과
  cur_unit: string; // 통화 코드 (USD, EUR, CNH 등)
  cur_nm: string; // 통화 이름
  ttb: string; // 전신환(송금) 받으실때
  tts: string; // 전신환(송금) 보내실때
  deal_bas_r: string; // 매매 기준율
  bkpr: string; // 장부가격
  yy_efee_r: string; // 년환가료율
  ten_dd_efee_r: string; // 10일환가료율
  kftc_deal_bas_r: string; // 서울외국환중개 매매기준율
  kftc_bkpr: string; // 서울외국환중개 장부가격
}

export interface ParsedExchangeRate {
  currency: string;
  currencyName: string;
  rate: number;
  ttb: number;
  tts: number;
  baseDate: string;
}

// 숫자 문자열을 파싱 (쉼표 제거)
function parseRate(rateStr: string): number {
  if (!rateStr) return 0;
  return parseFloat(rateStr.replace(/,/g, ""));
}

// 날짜를 YYYYMMDD 형식으로 변환
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// 통화 코드 매핑 (API 응답 → 내부 사용)
const CURRENCY_MAP: Record<string, string> = {
  USD: "USD",
  EUR: "EUR",
  CNH: "CNY", // 중국 위안화 (역외)
  JPY: "JPY",
};

// 지원하는 통화 목록
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "CNY"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// 한국수출입은행 API 호출
export async function fetchExchangeRatesFromKoreaExim(
  date?: Date
): Promise<ParsedExchangeRate[]> {
  const apiKey = process.env.KOREA_EXIM_API_KEY;

  if (!apiKey) {
    console.warn("KOREA_EXIM_API_KEY not configured");
    return [];
  }

  const searchDate = formatDateForApi(date || new Date());
  // API 키에 특수문자가 있을 수 있으므로 URL 인코딩
  const encodedApiKey = encodeURIComponent(apiKey);
  const url = `https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${encodedApiKey}&searchdate=${searchDate}&data=AP01`;

  console.log("Fetching exchange rate for date:", searchDate);

  try {
    // https 모듈 사용 (SSL 인증서 검증 우회)
    const data = await new Promise<ExchangeRateResponse[]>((resolve, reject) => {
      const req = https.get(url, { agent: httpsAgent }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            // 빈 응답 처리
            if (!body || body.trim() === "") {
              console.warn("환율 API 빈 응답");
              resolve([]);
              return;
            }
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            console.error("환율 API 응답 파싱 실패:", body.substring(0, 200));
            resolve([]); // 에러 대신 빈 배열 반환
          }
        });
      });
      req.on("error", (err) => {
        console.error("환율 API 요청 오류:", err.message);
        resolve([]); // 에러 대신 빈 배열 반환
      });
      req.setTimeout(10000, () => {
        req.destroy();
        console.error("환율 API 요청 시간 초과");
        resolve([]); // 에러 대신 빈 배열 반환
      });
    });

    if (!Array.isArray(data) || data.length === 0) {
      // 주말/공휴일에는 데이터가 없을 수 있음
      console.warn(`환율 데이터 없음: ${searchDate}`);
      return [];
    }

    // 첫 번째 결과 확인
    if (data[0].result !== 1) {
      const errorMessages: Record<number, string> = {
        2: "DATA코드 오류",
        3: "인증코드 오류",
        4: "일별 제한 횟수 초과",
      };
      throw new Error(
        errorMessages[data[0].result] || `알 수 없는 오류: ${data[0].result}`
      );
    }

    // 필요한 통화만 필터링하고 파싱
    const targetCurrencies = ["USD", "EUR", "CNH", "JPY(100)"];
    const rates: ParsedExchangeRate[] = data
      .filter((item) => targetCurrencies.includes(item.cur_unit))
      .map((item) => {
        let currency = item.cur_unit;
        let rate = parseRate(item.deal_bas_r);
        let ttb = parseRate(item.ttb);
        let tts = parseRate(item.tts);

        // JPY는 100엔 기준이므로 1엔 기준으로 변환
        if (currency === "JPY(100)") {
          currency = "JPY";
          rate = rate / 100;
          ttb = ttb / 100;
          tts = tts / 100;
        }

        // CNH -> CNY 변환
        if (currency === "CNH") {
          currency = "CNY";
        }

        return {
          currency,
          currencyName: item.cur_nm,
          rate,
          ttb,
          tts,
          baseDate: `${searchDate.slice(0, 4)}-${searchDate.slice(4, 6)}-${searchDate.slice(6, 8)}`,
        };
      });

    return rates;
  } catch (error) {
    console.error("환율 조회 오류:", error);
    throw error;
  }
}

// 특정 통화의 환율 조회
export async function fetchSingleExchangeRate(
  currency: SupportedCurrency,
  date?: Date
): Promise<ParsedExchangeRate | null> {
  const rates = await fetchExchangeRatesFromKoreaExim(date);
  return rates.find((r) => r.currency === currency) || null;
}

// 주말/공휴일 확인 (간단한 버전 - 주말만 체크)
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// 가장 최근 영업일 찾기
export function getLastBusinessDay(date: Date): Date {
  const result = new Date(date);
  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}
