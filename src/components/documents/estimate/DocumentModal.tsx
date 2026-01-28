// components/DocumentModal.tsx
import Image from "next/image";
import React from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface DocumentItem {
  name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount?: number;
}

interface DocumentContent {
  items?: DocumentItem[];
  total_amount?: number;
}

interface Document {
  date: string;
  document_number: string;
  company_name: string;
  contact_name: string;
  contact_level: string;
  valid_until?: string;
  delivery_term?: string;
  delivery_date?: string;
  payment_method: string;
  delivery_place?: string;
  user_name: string;
  user_level: string;
  content: DocumentContent;
  total_amount: number;
  notes: string;
}

interface DocumentModalProps {
  document: Document;
  onClose: () => void;
  company_fax: string;
  type: string;
  koreanAmount: (amount: number) => string;
  company_phone?: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  company_fax,
  type,
  koreanAmount,
  company_phone,
}) => {
  // ESC 키로 모달 닫기
  useEscapeKey(true, onClose);

  // 날짜 파싱 (NaN 방지) - 안전한 숫자 변환
  const safeParseInt = (value: string | undefined): number => {
    if (!value) return NaN;
    // 숫자만 추출 (앞의 숫자들만)
    const match = value.trim().match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return NaN;
  };

  const parseDate = (dateInput: string | undefined | null): { year: number; month: number; day: number } => {
    const now = new Date();
    const fallback = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

    if (!dateInput || typeof dateInput !== 'string') {
      return fallback;
    }

    // 공백 제거 및 정리
    const cleanDate = dateInput.trim();

    // YYYY-MM-DD 형식 시도
    const parts = cleanDate.split("-");
    if (parts.length >= 3) {
      const y = safeParseInt(parts[0]);
      const m = safeParseInt(parts[1]);
      const d = safeParseInt(parts[2]);

      // 모든 값이 유효한 숫자인지 확인
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 0 && m > 0 && m <= 12 && d > 0 && d <= 31) {
        return { year: y, month: m, day: d };
      }
    }

    // Date 객체로 파싱 시도
    const dateObj = new Date(cleanDate);
    if (!isNaN(dateObj.getTime())) {
      return {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        day: dateObj.getDate()
      };
    }

    return fallback;
  };

  const { year, month, day } = parseDate(document?.date);

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const formatContentForPrint = (content: string) => {
    return content.replace(/\n/g, "<br>");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && type === "estimate") {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>견적서</title>
          <style>
            @page {
              size: A4; /* A4 크기 지정 */
              margin: 5mm 0mm; 
            }
          </style>
        </head>
        <head>
        <title>견적서</title>
      </head>
      <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
  <tr>
  <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
  <img src="/images/order/gyunjekseo.gif" style="width: 239px; height: 69px;">
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
                <tr>
                    <td style=" font-weight: bold; font-size: 14px;">[문서번호]${
                      document.document_number
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">회사명 : ${
                      document.company_name
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">담당자명: ${
                      document.contact_name
                    } ${document.contact_level}님</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"</td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">유효기간 : ${
                      document.valid_until
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold;font-size: 14px;">납품일 : ${
                      document.delivery_term
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%;font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold;font-size: 14px;">결제방식 : ${
                      document.payment_method
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%;font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold;font-size: 14px;">납품장소 : ${
                      document.delivery_place
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%;font-size: 14px;"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table style="width: 98%; border: 0; margin: auto;">
                  <tr>
                    <td style="font-weight: bold;font-size: 14px;">견적자 : ${
                      document.user_name
                    } ${document.user_level}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td><img src="/images/order/bar.gif" style="width: 100%;"></td>
            </tr>
            <tr>
              <td style="font-weight: bold;font-size: 14px;">아래와 같이 견적합니다.</td>
            </tr>
          </table>
        </td>
        <td style="width: 55%; vertical-align: top; text-align: center;">
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
            
            ${document.content.items
              ?.map(
                (item: DocumentItem, index: number) =>
                  `<tr style="background-color: white; text-align: center;">
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">${
                  index + 1
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.name
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.spec
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.quantity
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.unit_price.toLocaleString()}</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">${item.amount?.toLocaleString()}</td>
              </tr>`
              )
              .join("")}
        
              ${
                (document.content.items?.length || 0) < 12
                  ? Array.from(
                      { length: 4 - (document.content.items?.length || 0) },
                      (_, i) => `
                      <tr style="background-color: white;">
                      <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">&nbsp;</td>
                      </tr>
                    `
                    ).join("")
                  : ""
              }
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
      합계(VAT별도) : 金${koreanAmount(
        document.total_amount
      )}원整(₩${document.total_amount?.toLocaleString()})
    </td>
  </tr>
  <tr>
    <td>
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
          <td style="padding: 12px; font-size: 10px; vertical-align: top;">
            <b>특기사항 : </br>${formatContentForPrint(
              document.notes
            )}</b> 
          </td>          
        </tr>
      </table>
    </td>
  </tr>
</table>
        </td>
      </tr>
    </table>
  </td>
</tr>

      </body>
      <script>
      window.onload = function () {
        window.print();
        setTimeout(() => window.close(), 500);
      };
    </script>
        </html>
      `);
      printWindow.document.close();
    } else if (printWindow && type === "order") {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>발주서</title>
          <style>
            @page {
              size: A4; /* A4 크기 지정 */
              margin: 5mm 0mm; 
            }
          </style>
        </head>
        <head>
        <title>발주서</title>
      </head>
      <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
  <tr>
  <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
  <img src="/images/order/baljuseo.gif" style="width: 239px; height: 69px;">
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
                <tr>
                    <td style=" font-weight: bold; font-size: 14px;">[문서번호]${
                      document.document_number
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">회사명 : ${
                      document.company_name
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">담당자명 : ${
                      document.contact_name
                    } ${document.contact_level}님</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"</td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">납기일자 : ${
                      document.delivery_date
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold;font-size: 14px;">결제방식 : ${
                      document.payment_method
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%;font-size: 14px;"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table style="width: 98%; border: 0; margin: auto;">
                  <tr>
                    <td style="font-weight: bold;font-size: 14px;">발주자 : ${
                      document.user_name
                    } ${document.user_level}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td><img src="/images/order/bar.gif" style="width: 100%;"></td>
            </tr>
            <tr>
              <td style="font-weight: bold;font-size: 14px;">아래와 같이 발주합니다.</td>
            </tr>
          </table>
        </td>
        <td style="width: 55%; vertical-align: top; text-align: center;">
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
            
            ${document.content.items
              ?.map(
                (item: DocumentItem, index: number) =>
                  `<tr style="background-color: white; text-align: center;">
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">${
                  index + 1
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.name
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.spec
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.quantity
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.unit_price.toLocaleString()}</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">${item.amount?.toLocaleString()}</td>
              </tr>`
              )
              .join("")}
        
              ${
                (document.content.items?.length || 0) < 12
                  ? Array.from(
                      { length: 4 - (document.content.items?.length || 0) },
                      (_, i) => `
                      <tr style="background-color: white;">
                      <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">&nbsp;</td>
                      </tr>
                    `
                    ).join("")
                  : ""
              }
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
      합계(VAT별도) : 金${koreanAmount(
        document.total_amount
      )}원整(₩${document.total_amount.toLocaleString()})
    </td>
  </tr>
  <tr>
    <td>
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
          <td style="padding: 10px; font-size: 12px; vertical-align: top;">
            <b>특기사항 : </br>${formatContentForPrint(
              document.notes
            )}</b> 
          </td>          
        </tr>
      </table>
    </td>
  </tr>
</table>
        </td>
      </tr>
    </table>
  </td>
</tr>

      </body>
      <script>
      window.onload = function () {
        window.print();
        setTimeout(() => window.close(), 500);
      };
    </script>
        </html>
      `);
      printWindow.document.close();
    } else if (printWindow && type === "requestQuote") {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>견적의뢰서</title>
          <style>
            @page {
              size: A4; /* A4 크기 지정 */
              margin: 5mm 0mm; 
            }
          </style>
        </head>
        <head>
        <title>견적의뢰서</title>
      </head>
      <body style="margin: 0; font-family: Arial, sans-serif; font-size: 12px !important;">
      
      <table style="width: 680px; border: 0; cellspacing: 0; cellpadding: 0; margin: auto;">
  <tr>
  <td style="height: 58px; display: flex; justify-content: center; align-items: center;">
  <img src="/images/order/gyunjekseo02.gif" style="width: 239px; height: 69px;">
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
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">회사명 : ${
                      document.company_name
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">담당자명 : ${
                      document.contact_name
                    } ${document.contact_level}님</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">TEL : ${company_phone}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">FAX : ${company_fax}</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"</td>
                  </tr>
                  <tr>
                    <td style=" font-weight: bold; font-size: 14px;">희망견적일 : ${
                      document.delivery_date
                    }</td>
                  </tr>
                  <tr>
                    <td><img src="/images/order/split_line1.gif" style="width: 100%; font-size: 14px;"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table style="width: 98%; border: 0; margin: auto;">
                  <tr>
                    <td style="font-weight: bold;font-size: 14px;">의뢰자 : ${
                      document.user_name
                    } ${document.user_level}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td><img src="/images/order/bar.gif" style="width: 100%;"></td>
            </tr>
            <tr>
              <td style="font-weight: bold;font-size: 14px;">아래와 같이 견적을 의뢰합니다.</td>
            </tr>
          </table>
        </td>
        <td style="width: 55%; vertical-align: top; text-align: center;">
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
            
            ${document.content.items
              ?.map(
                (item: DocumentItem, index: number) =>
                  `<tr style="background-color: white; text-align: center;">
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">${
                  index + 1
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.name
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.spec
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${
                  item.quantity
                }</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">${item.unit_price.toLocaleString()}</td>
                <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">${""}</td>
              </tr>`
              )
              .join("")}
        
              ${
                (document.content.items?.length || 0) < 12
                  ? Array.from(
                      { length: 4 - (document.content.items?.length || 0) },
                      (_, i) => `
                      <tr style="background-color: white;">
                      <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black; solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; border-right: 1px solid black;">&nbsp;</td>
                        <td style="padding: 5px; border-top: 1px solid black; border-bottom: 1px solid black; ">&nbsp;</td>
                      </tr>
                    `
                    ).join("")
                  : ""
              }
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
          <td style="padding: 10px; font-size: 12px; vertical-align: top;">
            <b>특기사항 : </br>${formatContentForPrint(
              document.notes
            )}</b> 
          </td>          
        </tr>
      </table>
    </td>
  </tr>
</table>
        </td>
      </tr>
    </table>
  </td>
</tr>

      </body>
      <script>
      window.onload = function () {
        window.print();
        setTimeout(() => window.close(), 500);
      };
    </script>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
      <div
        className={`
        bg-white p-6 rounded-md max-h-screen overflow-y-scroll
        w-full md:w-2/3 md:max-w-6xl
      `}
      >
        {type === "estimate" && (
          <>
            <div className="flex justify-center relative">
              <h1 className="font-bold text-4xl">
                견{"  "}적{"  "}서
              </h1>
              <div className="flex justify-end absolute left-0 -bottom-4">
                <div className="relative">
                  <h1>
                    {year}년 {month}월 {day}일
                  </h1>
                </div>
              </div>
              <div className="flex justify-end absolute right-0 -bottom-4">
                <div className="relative">
                  <p>{document.document_number}</p>
                </div>
              </div>
              <div className="absolute -bottom-5 border-b-2 border-black w-full"></div>
              <div className="absolute -bottom-6 border-b-2 border-black w-full"></div>
            </div>
            <div className="mt-10"></div>

            <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
              <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
                <div className="relative">
                  <p>회사명 : {document.company_name}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>
                    담당자명 : {document.contact_name} {document.contact_level}
                    님
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p> TEL : {company_phone || ""} </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>FAX : {company_fax || ""}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>유효기간 : {document.valid_until}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>납품일 : {document.delivery_term}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>결제방식 : {document.payment_method}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>납품장소 : {document.delivery_place}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="mt-12 relative">
                  <p>
                    견적자 : {document.user_name} {document.user_level}
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
                </div>
                <p>아래와 같이 견적합니다.</p>
              </div>
              <div className="col-span-2 space-y-2 ml-12 hidden md:block">
                <div className="flex items-center space-x-6">
                  <Image
                    src={"/images/logo.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                  <span className="font-bold text-xl">우 양 신 소 재</span>
                  <Image
                    src={"/images/dojang.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>본사 :</p>
                  </div>
                  <div>
                    <p>대구광역시 북구 유통단지로 8길 21</p>
                    <p>TEL : (053)383-5287</p>
                    <p>FAX : (053)383-5283</p>
                  </div>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>공장 :</p>
                  </div>
                  <div>
                    <p>구미시 산동면 첨단기업3로 81</p>
                    <p>TEL : (054)476-3100</p>
                    <p>FAX : (054)476-3104</p>
                  </div>
                </div>
                <div className="space-y-2 font-semibold">
                  <p>홈페이지 : www.iwooyang.com</p>
                  <p>전자우편 : info@iwooyang.com</p>
                </div>
              </div>
            </div>
            <div>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <thead>
                  <tr className="bg-gray-100 text-left border-black border-2">
                    <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
                      No
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center  w-5/12">
                      품명
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      규격
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      수량
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      단가
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="border-black border-2">
                  {document.content.items?.map((item: DocumentItem, index: number) => (
                    <tr
                      className="hover:bg-gray-50 border-b-[1px] border-black"
                      key={index}
                    >
                      <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.spec}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
                        {item.amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <thead>
                  <tr className="text-left border-black border-2">
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      합계(VAT별도) : 金
                      {koreanAmount(document.content?.total_amount || 0)}원整 (₩
                      {document.total_amount.toLocaleString()})
                    </th>
                  </tr>
                </thead>
                <tbody className="border-black border-2">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-black border-r-[1px]">
                      <div className="grid grid-cols-3">
                        <ul className="border-r-[1px] border-black pr-4 col-span-1 text-xs text-start px-2 list-disc">
                          <li>산업용섬유(불연,도전,고강도) 사업부</li>
                          <li>고기능 플렉시블호스 사업부</li>
                          <li>플라스틱 및 복합소재 사업부</li>
                          <li>특수벨트 및 풀리 사업부</li>
                          <li>기술자문 및 연구개발전문</li>
                        </ul>
                        <div className="col-span-2 text-xs text-start px-2">
                          <div>
                            <p>특기사항</p>
                            <p>
                              {formatContentWithLineBreaks(
                                document.notes
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                닫기
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                프린트
              </button>
            </div>
          </>
        )}
        {type === "order" && (
          <>
            <div className="flex justify-center relative">
              <h1 className="font-bold text-4xl">
                발{"  "}주{"  "}서
              </h1>
              <div className="flex justify-end absolute left-0 -bottom-4">
                <div className="relative">
                  <h1>
                    {year}년 {month}월 {day}일
                  </h1>
                </div>
              </div>
              <div className="flex justify-end absolute right-0 -bottom-4">
                <div className="relative">
                  <p>{document.document_number}</p>
                </div>
              </div>
              <div className="absolute -bottom-5 border-b-2 border-black w-full"></div>
              <div className="absolute -bottom-6 border-b-2 border-black w-full"></div>
            </div>
            <div className="mt-10"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
              <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
                <div className="relative">
                  <p>회사명 : {document.company_name}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>
                    담당자명 : {document.contact_name} {document.contact_level}
                    님
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p> TEL : {company_phone} </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>FAX : {company_fax}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>납기일자 : {document.delivery_date}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>결제방식 : {document.payment_method}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="mt-12 relative">
                  <p>
                    발주자 :{document.user_name} {document.user_level}
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
                </div>
                <p>아래와 같이 발주합니다.</p>
              </div>
              <div className="col-span-2 space-y-2 ml-12 hidden md:block">
                <div className="flex items-center space-x-6">
                  <Image
                    src={"/images/logo.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                  <span className="font-bold text-xl">우 양 신 소 재</span>
                  <Image
                    src={"/images/dojang.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>본사 :</p>
                  </div>
                  <div>
                    <p>대구광역시 북구 유통단지로 8길 21</p>
                    <p>TEL : (053)383-5287</p>
                    <p>FAX : (053)383-5283</p>
                  </div>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>공장 :</p>
                  </div>
                  <div>
                    <p>구미시 산동면 첨단기업3로 81</p>
                    <p>TEL : (054)476-3100</p>
                    <p>FAX : (054)476-3104</p>
                  </div>
                </div>
                <div className="space-y-2 font-semibold">
                  <p>홈페이지 : www.iwooyang.com</p>
                  <p>전자우편 : info@iwooyang.com</p>
                </div>
              </div>
            </div>
            <div>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <thead>
                  <tr className="bg-gray-100 text-left border-black border-2">
                    <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
                      No
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center  w-5/12">
                      품명
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      규격
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      수량
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      단가
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="border-black border-2">
                  {document.content.items?.map((item: DocumentItem, index: number) => (
                    <tr
                      className="hover:bg-gray-50 border-b-[1px] border-black"
                      key={index}
                    >
                      <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.spec}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
                        {item.amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <thead>
                  <tr className="text-left border-black border-2">
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      합계(VAT별도) : 金
                      {koreanAmount(document.total_amount)}원整 (₩
                      {document.total_amount.toLocaleString()})
                    </th>
                  </tr>
                </thead>
                <tbody className="border-black border-2">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-black border-r-[1px]">
                      <div className="grid grid-cols-3">
                        <ul className="border-r-[1px] border-black pr-4 col-span-1 text-xs text-start px-2 list-disc">
                          <li>산업용섬유(불연,도전,고강도) 사업부</li>
                          <li>고기능 플렉시블호스 사업부</li>
                          <li>플라스틱 및 복합소재 사업부</li>
                          <li>특수벨트 및 풀리 사업부</li>
                          <li>기술자문 및 연구개발전문</li>
                        </ul>
                        <div className="col-span-2 text-xs text-start px-2">
                          <div>
                            <p>특기사항</p>
                            <p>
                              {formatContentWithLineBreaks(
                                document.notes
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                닫기
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                프린트
              </button>
            </div>
          </>
        )}
        {type === "requestQuote" && (
          <>
            <div className="flex justify-center relative">
              <h1 className="font-bold text-4xl">견 적 의 뢰 서</h1>
              <div className="flex justify-end absolute left-0 -bottom-4">
                <div className="relative">
                  <h1>
                    {year}년 {month}월 {day}일
                  </h1>
                </div>
              </div>
              <div className="flex justify-end absolute right-0 -bottom-4">
                <div className="relative">
                  <p>{document.document_number}</p>
                </div>
              </div>
              <div className="absolute -bottom-5 border-b-2 border-black w-full"></div>
              <div className="absolute -bottom-6 border-b-2 border-black w-full"></div>
            </div>
            <div className="mt-10"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
              <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
                <div className="relative">
                  <p>회사명 : {document.company_name}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>
                    담당자명 : {document.contact_name} {document.contact_level}
                    님
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p> TEL : {company_phone} </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="relative">
                  <p>FAX : {company_fax}</p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
                </div>
                <div className="mt-12 relative">
                  <p>
                    의뢰자 :{document.user_name} {document.user_level}
                  </p>
                  <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
                </div>
                <p>아래와 같이 견적을 의뢰합니다.</p>
              </div>
              <div className="col-span-2 space-y-2 ml-12 hidden md:block">
                <div className="flex items-center space-x-6">
                  <Image
                    src={"/images/logo.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                  <span className="font-bold text-xl">우 양 신 소 재</span>
                  <Image
                    src={"/images/dojang.gif"}
                    width="55"
                    height="55"
                    alt="logo"
                  />
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>본사 :</p>
                  </div>
                  <div>
                    <p>대구광역시 북구 유통단지로 8길 21</p>
                    <p>TEL : (053)383-5287</p>
                    <p>FAX : (053)383-5283</p>
                  </div>
                </div>
                <div className="flex space-x-4 font-semibold">
                  <div>
                    <p>공장 :</p>
                  </div>
                  <div>
                    <p>구미시 산동면 첨단기업3로 81</p>
                    <p>TEL : (054)476-3100</p>
                    <p>FAX : (054)476-3104</p>
                  </div>
                </div>
                <div className="space-y-2 font-semibold">
                  <p>홈페이지 : www.iwooyang.com</p>
                  <p>전자우편 : info@iwooyang.com</p>
                </div>
              </div>
            </div>
            <div>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <thead>
                  <tr className="bg-gray-100 text-left border-black border-2">
                    <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
                      No
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center  w-5/12">
                      품명
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      규격
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
                      수량
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      단위
                    </th>
                    <th className="px-4 py-2 border-black border-r-[1px] text-center">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody className="border-black border-2">
                  {document.content.items?.map((item: DocumentItem, index: number) => (
                    <tr
                      className="hover:bg-gray-50 border-b-[1px] border-black"
                      key={index}
                    >
                      <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.name}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.spec}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {item.unit_price}
                      </td>
                      <td className="px-4 py-2 border-black border-r-[1px]">
                        {/* {item.amount?.toLocaleString()} */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="min-w-full table-auto border-collapse text-center mt-6">
                <tbody className="border-black border-2">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-black border-r-[1px]">
                      <div className="grid grid-cols-3">
                        <ul className="border-r-[1px] border-black pr-4 col-span-1 text-xs text-start px-2 list-disc">
                          <li>산업용섬유(불연,도전,고강도) 사업부</li>
                          <li>고기능 플렉시블호스 사업부</li>
                          <li>플라스틱 및 복합소재 사업부</li>
                          <li>특수벨트 및 풀리 사업부</li>
                          <li>기술자문 및 연구개발전문</li>
                        </ul>
                        <div className="col-span-2 text-xs text-start px-2">
                          <div>
                            <p>특기사항</p>
                            <p>
                              {formatContentWithLineBreaks(
                                document.notes
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                닫기
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                프린트
              </button>
            </div>
          </>
        )}
      </div>
      {/* dnl */}
    </div>
  );
};

export default DocumentModal;
