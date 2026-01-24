// Document Print Templates Utility

export interface PrintDocumentData {
  document_number: string;
  date: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  payment_method?: string;
  content: {
    company_name?: string | null;
    items: Array<{
      name: string;
      spec: string;
      quantity: string;
      unit_price: number;
      amount?: number;
    }>;
    // 폴백용 (레거시)
    notes?: string | null;
    total_amount?: number | null;
    valid_until?: string | null;
    delivery_term?: string | null;
    delivery_place?: string | null;
    delivery_date?: string | null;
    payment_method?: string | null;
  };
  // 분리된 컬럼들
  company_name?: string | null;
  notes?: string | null;
  total_amount?: number;
  valid_until?: string | null;
  delivery_term?: string | null;
  delivery_place?: string | null;
  delivery_date?: string | null;
  delivery_date_note?: string | null; // 납기일 표시용 비고 (빠른시일내 등)
}

interface PrintOptions {
  company_phone?: string;
  company_fax?: string;
  koreanAmount: (amount: number) => string;
}

const formatContentForPrint = (content: string) => {
  return content?.replace(/\n/g, "<br>") || "";
};

const getCommonStyles = () => `
  @page {
    size: A4;
    margin: 5mm 0mm;
  }
`;

const getCompanyInfo = () => `
  <table style="width: 96%; border: 0;">
    <tr>
      <td>
        <table style="width: 85%; border: 0; margin: auto;">
          <tr>
            <td><img src="/images/order/w_logo.gif" style="width: 60px;"></td>
            <td style="text-align: center; font-weight: bold; font-size: 22px;">우양 신소재</td>
            <td style="text-align: right;"><img src="/images/order/ju_sign.gif" style="width: 60px;"></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table style="width: 100%; border: 0; margin-top: 8px;">
          <tr>
            <td style="width: 15%; font-weight: bold; font-size: 14px;">본사 :</td>
            <td style="width: 85%; font-size: 14px;">
              대구광역시 북구 유통단지로 8길 21<br>
              TEL : (053)383-5287 <br>
              FAX : (053)383-5283
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table style="width: 100%; border: 0; margin-top: 8px;">
          <tr>
            <td style="width: 15%; font-weight: bold; font-size: 14px;">공장 :</td>
            <td style="width: 85%; font-size: 14px;">
              구미시 산동면 첨단기업3로 81<br>
              TEL : (054)476-3100<br>
              FAX : (054)476-3104
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table style="width: 100%; border: 0; margin-top: 8px;">
          <tr>
            <td style="width: 22%; font-weight: bold; font-size: 14px;">홈페이지 :</td>
            <td style="width: 78%; font-size: 14px;">www.iwooyang.com</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        <table style="width: 100%; border: 0; margin-top: 8px;">
          <tr>
            <td style="width: 22%; font-weight: bold; font-size: 14px;">전자우편 :</td>
            <td style="width: 78%;font-size: 14px;">info@iwooyang.com</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const getItemsTable = (items: any[], showPrice: boolean = true) => {
  const itemRows = items
    ?.map(
      (item: any, index: number) =>
        `<tr style="background-color: white; text-align: center;">
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${index + 1}</td>
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.name}</td>
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.spec}</td>
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.quantity}</td>
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${showPrice ? item.unit_price?.toLocaleString() : item.unit_price}</td>
          <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black;">${showPrice ? (item.amount?.toLocaleString() || "") : ""}</td>
        </tr>`
    )
    .join("");

  const emptyRows =
    items?.length < 12
      ? Array.from(
          { length: 4 - items.length },
          () => `
            <tr style="background-color: white;">
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
              <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black;">&nbsp;</td>
            </tr>
          `
        ).join("")
      : "";

  return itemRows + emptyRows;
};

const getFooterSection = (notes: string, showBusinessInfo: boolean = true) => `
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; padding: 10px; font-weight: bold; font-size: 12px;">
        ・ 산업용 섬유(불연, 도전, 고강도) 사업부 <br>
        ・ 고기능 플렉시블호스 사업부 <br>
        ・ 플라스틱 및 복합소재 사업부 <br>
        ・ 특수 벨트 및 풀리 사업부 <br>
        ・ 기술자문 및 연구 개발 전문
      </td>
      <td style="border-right: 1px solid black;"></td>
      <td style="padding: 10px; font-size: 10px; vertical-align: top;">
        <b>특기사항 : <br>${notes}</b>
      </td>
    </tr>
  </table>
`;

const getPrintScript = () => `
  <script>
    window.onload = function () {
      window.print();
      setTimeout(() => window.close(), 500);
    };
  </script>
`;

export function generateEstimatePrintHTML(
  doc: PrintDocumentData,
  options: PrintOptions
): string {
  const dateStr = doc.date || new Date().toISOString().split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const { company_phone, company_fax, koreanAmount } = options;

  const companyName = doc.company_name || "";
  const validUntil = doc.valid_until || "";
  // 납기 표시: delivery_date_note가 있고 마커가 아니면 사용, 없으면 날짜 표시
  const deliveryDateNote = doc.delivery_date_note && doc.delivery_date_note !== "__직접입력__"
    ? doc.delivery_date_note
    : null;
  const deliveryTerm = deliveryDateNote || doc.delivery_date || "";
  const deliveryPlace = doc.delivery_place || "";
  const totalAmount = doc.total_amount ?? 0;
  const notes = doc.notes || "";

  return `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>견적서</title>
      <style>${getCommonStyles()}</style>
    </head>
    <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
        <tr>
          <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
            <img src="/images/order/gyunjekseo.gif" style="width: 239px; height: 69px;">
          </td>
        </tr>
        <tr>
          <td style="height: 58px;">
            <table style="width: 95%; border: 0; margin: auto;">
              <tr>
                <td>&nbsp;</td>
                <td>
                  <table style="width: 225px; border: 0; margin: auto; text-align: center;">
                    <tr>
                      <td style="font-weight: bold; font-size: 14px; text-align: center;">
                        견적일자&nbsp;:&nbsp;${year}년 ${month}월 ${day}일
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="width: 67%; height: 3px;"></td>
                <td style="width: 33%; height: 3px;">
                  <img src="/images/order/date_line.gif" style="width: 230px; height: 5px; display: block; margin: auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table style="width: 98%; border: 0; margin: auto;">
              <tr>
                <td style="width: 45%;">
                  <table style="width: 95%; border: 0;">
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td style="font-weight: bold; font-size: 14px;">[문서번호]${doc.document_number}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">회사명 : ${companyName}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">담당자명: ${doc.contact_name} ${doc.contact_level}님</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">유효기간 : ${validUntil}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">납품일 : ${deliveryTerm}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">결제방식 : ${doc.payment_method}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">납품장소 : ${deliveryPlace}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td style="font-weight: bold; font-size: 14px;">견적자 : ${doc.user_name} ${doc.user_level}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td><img src="/images/order/bar.gif" style="width: 100%;"></td></tr>
                    <tr><td style="font-weight: bold; font-size: 14px;">아래와 같이 견적합니다.</td></tr>
                  </table>
                </td>
                <td style="width: 55%; vertical-align: top; text-align: center;">
                  ${getCompanyInfo()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #EBEBEB; font-weight: bold;">
                      <td style="width: 6%; text-align: center; padding: 5px; border-right: 1px solid black;">NO</td>
                      <td style="width: 30%; text-align: center; padding: 5px; border-right: 1px solid black;">상품명</td>
                      <td style="width: 24%; text-align: center; padding: 5px; border-right: 1px solid black;">규격</td>
                      <td style="width: 9%; text-align: center; padding: 5px; border-right: 1px solid black;">수량</td>
                      <td style="width: 14%; text-align: center; padding: 5px; border-right: 1px solid black;">단가</td>
                      <td style="width: 17%; text-align: center; padding: 5px;">금액</td>
                    </tr>
                    ${getItemsTable(doc.content.items)}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 10px; border-bottom: 1px solid black; font-size: 14px;">
                  합계(VAT별도) : 金${koreanAmount(totalAmount)}원整(₩${totalAmount?.toLocaleString()})
                </td>
              </tr>
              <tr>
                <td>
                  ${getFooterSection(formatContentForPrint(notes))}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    ${getPrintScript()}
    </html>
  `;
}

export function generateOrderPrintHTML(
  doc: PrintDocumentData,
  options: PrintOptions
): string {
  const dateStr = doc.date || new Date().toISOString().split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const { company_phone, company_fax, koreanAmount } = options;

  const companyName = doc.company_name || "";
  // 납기 표시: delivery_date_note가 있고 마커가 아니면 사용, 없으면 날짜 표시
  const deliveryDateNote = doc.delivery_date_note && doc.delivery_date_note !== "__직접입력__"
    ? doc.delivery_date_note
    : null;
  const deliveryDate = deliveryDateNote || doc.delivery_date || "";
  const totalAmount = doc.total_amount ?? 0;
  const notes = doc.notes || "";

  return `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>발주서</title>
      <style>${getCommonStyles()}</style>
    </head>
    <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
        <tr>
          <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
            <img src="/images/order/baljuseo.gif" style="width: 239px; height: 69px;">
          </td>
        </tr>
        <tr>
          <td style="height: 58px;">
            <table style="width: 95%; border: 0; margin: auto;">
              <tr>
                <td>&nbsp;</td>
                <td>
                  <table style="width: 225px; border: 0; margin: auto; text-align: center;">
                    <tr>
                      <td style="font-weight: bold; font-size: 14px; text-align: center;">
                        발주일자&nbsp;:&nbsp;${year}년 ${month}월 ${day}일
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="width: 67%; height: 3px;"></td>
                <td style="width: 33%; height: 3px;">
                  <img src="/images/order/date_line.gif" style="width: 230px; height: 5px; display: block; margin: auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table style="width: 98%; border: 0; margin: auto;">
              <tr>
                <td style="width: 45%;">
                  <table style="width: 95%; border: 0;">
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td style="font-weight: bold; font-size: 14px;">[문서번호]${doc.document_number}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">회사명 : ${companyName}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">담당자명 : ${doc.contact_name} ${doc.contact_level}님</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">납기일자 : ${deliveryDate}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">결제방식 : ${doc.payment_method}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td style="font-weight: bold; font-size: 14px;">발주자 : ${doc.user_name} ${doc.user_level}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td><img src="/images/order/bar.gif" style="width: 100%;"></td></tr>
                    <tr><td style="font-weight: bold; font-size: 14px;">아래와 같이 발주합니다.</td></tr>
                  </table>
                </td>
                <td style="width: 55%; vertical-align: top; text-align: center;">
                  ${getCompanyInfo()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #EBEBEB; font-weight: bold;">
                      <td style="width: 6%; text-align: center; padding: 5px; border-right: 1px solid black;">NO</td>
                      <td style="width: 30%; text-align: center; padding: 5px; border-right: 1px solid black;">상품명</td>
                      <td style="width: 24%; text-align: center; padding: 5px; border-right: 1px solid black;">규격</td>
                      <td style="width: 9%; text-align: center; padding: 5px; border-right: 1px solid black;">수량</td>
                      <td style="width: 14%; text-align: center; padding: 5px; border-right: 1px solid black;">단가</td>
                      <td style="width: 17%; text-align: center; padding: 5px;">금액</td>
                    </tr>
                    ${getItemsTable(doc.content.items)}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td style="text-align: center; font-weight: bold; padding: 10px; border-bottom: 1px solid black; font-size: 14px;">
                  합계(VAT별도) : 金${koreanAmount(totalAmount)}원整(₩${totalAmount?.toLocaleString()})
                </td>
              </tr>
              <tr>
                <td>
                  ${getFooterSection(formatContentForPrint(notes))}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    ${getPrintScript()}
    </html>
  `;
}

export function generateRequestQuotePrintHTML(
  doc: PrintDocumentData,
  options: PrintOptions
): string {
  const dateStr = doc.date || new Date().toISOString().split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);
  const { company_phone, company_fax } = options;

  const companyName = doc.company_name || "";
  const deliveryDate = doc.delivery_date || "";
  const notes = doc.notes || "";

  return `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>견적의뢰서</title>
      <style>${getCommonStyles()}</style>
    </head>
    <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
        <tr>
          <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
            <img src="/images/order/gyunjekseo02.gif" style="width: 239px; height: 69px;">
          </td>
        </tr>
        <tr>
          <td style="height: 58px;">
            <table style="width: 95%; border: 0; margin: auto;">
              <tr>
                <td>&nbsp;</td>
                <td>
                  <table style="width: 225px; border: 0; margin: auto; text-align: center;">
                    <tr>
                      <td style="font-weight: bold; font-size: 14px; text-align: center;">
                        의뢰일자&nbsp;:&nbsp;${year}년 ${month}월 ${day}일
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="width: 67%; height: 3px;"></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table style="width: 98%; border: 0; margin: auto;">
              <tr>
                <td style="width: 45%;">
                  <table style="width: 95%; border: 0;">
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">회사명 : ${companyName}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">담당자명 : ${doc.contact_name} ${doc.contact_level}님</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                          <tr><td style="font-weight: bold; font-size: 14px;">희망견적일 : ${deliveryDate}</td></tr>
                          <tr><td><img src="/images/order/split_line1.gif" style="width: 100%;"></td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table style="width: 98%; border: 0; margin: auto;">
                          <tr><td style="font-weight: bold; font-size: 14px;">의뢰자 : ${doc.user_name} ${doc.user_level}</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr><td><img src="/images/order/bar.gif" style="width: 100%;"></td></tr>
                    <tr><td style="font-weight: bold; font-size: 14px;">아래와 같이 견적을 의뢰합니다.</td></tr>
                  </table>
                </td>
                <td style="width: 55%; vertical-align: top; text-align: center;">
                  ${getCompanyInfo()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #EBEBEB; font-weight: bold;">
                      <td style="width: 6%; text-align: center; padding: 5px; border-right: 1px solid black;">NO</td>
                      <td style="width: 30%; text-align: center; padding: 5px; border-right: 1px solid black;">상품명</td>
                      <td style="width: 24%; text-align: center; padding: 5px; border-right: 1px solid black;">규격</td>
                      <td style="width: 9%; text-align: center; padding: 5px; border-right: 1px solid black;">수량</td>
                      <td style="width: 14%; text-align: center; padding: 5px; border-right: 1px solid black;">단위</td>
                      <td style="width: 17%; text-align: center; padding: 5px;">비고</td>
                    </tr>
                    ${getItemsTable(doc.content.items, false)}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <br>
            <table style="width: 100%; border-collapse: collapse; margin: auto; border: 3px solid black;">
              <tr>
                <td>
                  ${getFooterSection(formatContentForPrint(notes))}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    ${getPrintScript()}
    </html>
  `;
}

export function printDocument(
  type: string,
  doc: PrintDocumentData,
  options: PrintOptions
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  let html = "";
  switch (type) {
    case "estimate":
      html = generateEstimatePrintHTML(doc, options);
      break;
    case "order":
      html = generateOrderPrintHTML(doc, options);
      break;
    case "requestQuote":
      html = generateRequestQuotePrintHTML(doc, options);
      break;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
