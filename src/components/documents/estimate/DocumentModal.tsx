"use client";

// components/DocumentModal.tsx
import Image from "next/image";
import type React from "react";
import { Calendar, Printer, X, FileText } from "lucide-react";

interface DocumentModalProps {
  document: any; // 문서 전체를 prop으로 받음
  onClose: () => void; // 모달을 닫을 때 호출되는 함수
  company_fax: string;
  type: "requestQuote" | "estimate" | "order" | any;
  koreanAmount: any;
  company_phone?: any;
  // 추가 props는 무시하도록 설정
  [key: string]: any;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  company_fax,
  type,
  koreanAmount,
  company_phone,
}) => {
  const [datePart] = document.created_at.split("T"); // "2025-02-12"
  const [year, month, day] = datePart.split("-").map(Number);

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line: any, index: any) => (
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
    if (!printWindow) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    if (printWindow && type === "estimate") {
      printWindow.document.open();
      printWindow.document.write(`
<html>
<head>
  <meta charset="UTF-8">
  <title>견적서</title>
  <style>
    @font-face {
      font-family: 'NanumSquareNeo';
      src: url('/fonts/NanumSquareNeo-Variable.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    @page {
      size: A4; /* A4 크기 지정 */
      margin: 15mm 10mm 20mm 10mm; /* 상단, 우측, 하단, 좌측 여백 설정 */
    }
    body {
      margin: 0; 
      font-family: "NanumSquareNeo", sans-serif; 
      font-size: 12px !important;
    }
    /* 테이블 관련 설정 */
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    /* 테이블 헤더는 각 페이지에서 반복 */
    thead {
      display: table-header-group;
    }
    /* 테이블 행은 필요시 자연스럽게 나눠지도록 설정 */
    tr {
      page-break-inside: auto;
    }
    /* 테이블 푸터는 각 페이지 마지막에 표시 */
    tfoot {
      display: table-footer-group;
    }
    /* 페이지 나누기 방지가 필요한 요소 */
    .avoid-break {
      page-break-inside: avoid;
    }
    /* 기존 스타일은 유지 */
    .section-header {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 4px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    .section-content {
      padding: 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }
    .info-label {
      font-size: 11px;
      color: #6b7280;
      margin: 0 0 1px 0;
    }
    .info-value {
      font-weight: 500;
      font-size: 10px;
      margin: 0;
    }
    .address-line {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* 섹션 간 간격 조정 */
    .section {
      margin-bottom: 15px;
    }
    /* 페이지 내 요소들이 자연스럽게 흐르도록 설정 */
    .flow-content {
      page-break-inside: auto;
    }
  </style>
</head>
<body>
  <!-- 헤더 섹션 -->
  <div style="background: linear-gradient(to right, #1e40af, #1e3a8a); color: white; padding: 15px 20px; border-radius: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">견적서</h2>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
      <div style="font-size: 14px; opacity: 0.9;">
        ${year}년 ${month}월 ${day}일
      </div>
      <div style="font-size: 14px; font-family: monospace;">
        ${document.document_number}
      </div>
    </div>
  </div>

  <div style="padding: 15px 20px;" class="flow-content">
    <!-- 회사 로고 및 정보 -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: center;">
        <!-- 로고 및 도장 -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
          <img src="/images/logo.png" alt="우양 신소재 로고" style="width: 250px; height: 40px; object-fit: contain;">
          <img src="/images/dojang.png" alt="도장" style="width: 35px; height: 35px; object-fit: contain;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <!-- 본사 정보 -->
          <div>
            <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">본사</p>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
              <span style="font-size: 10px;" class="address-line">대구 북구 유통단지로 8길 21</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
              <span style="font-size: 10px;">(053)383-5287</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
              <span style="font-size: 10px;">(053)383-5283</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">홈</span>
              <span style="font-size: 10px;">www.iwooyang.com</span>
            </div>
          </div>
          
          <!-- 공장 정보 -->
          <div>
            <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">공장</p>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
              <span style="font-size: 10px;" class="address-line">구미시 산동면 첨단기업3로 81</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
              <span style="font-size: 10px;">(054)476-3100</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
              <span style="font-size: 10px;">(054)476-3104</span>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">메일</span>
              <span style="font-size: 10px;">info@iwooyang.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 거래처 정보 및 문서 정보 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;" class="section">
      <!-- 거래처 정보 -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        <h3 class="section-header">거래처 정보</h3>
        <div class="info-grid">
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">회사명</p>
              <p class="info-value">${document.content.company_name}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">담당자</p>
              <p class="info-value">${document.contact_name} ${
        document.contact_level
      }</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">전화번호</p>
              <p class="info-value">${company_phone || "정보 없음"}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">팩스</p>
              <p class="info-value">${company_fax || "정보 없음"}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 문서 정보 -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        <h3 class="section-header">문서 정보</h3>
        <div class="info-grid">
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">유효기간</p>
              <p class="info-value">${document.content.valid_until}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">납품일</p>
              <p class="info-value">${document.content.delivery_term}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">납품장소</p>
              <p class="info-value">${document.content.delivery_place}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">결제방식</p>
              <p class="info-value">${document.payment_method}</p>
            </div>
          </div>
          <div style="margin-bottom: 3px;">
            <div>
              <p class="info-label">견적자</p>
              <p class="info-value">${document.user_name} ${
        document.user_level
      }</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 항목 테이블 -->
    <div style="margin-bottom: 15px;" class="section">
      <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #374151;">견적 항목</h3>
      <table>
        <thead>
          <tr>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">No</th>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">품명</th>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">규격</th>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">수량</th>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">단가</th>
            <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${
            document.content.items
              ?.map(
                (item: any, index: any) => `
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                index + 1
              }</td>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: 500;">${
                item.name
              }</td>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                item.spec
              }</td>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                item.quantity
              }</td>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.unit_price?.toLocaleString()}</td>
              <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.amount?.toLocaleString()}</td>
            </tr>
          `
              )
              .join("") ||
            `
            <tr>
              <td colspan="6" style="text-align: center; padding: 15px; color: #6b7280; border: 1px solid #e5e7eb; font-size: 12px;">
                항목이 없습니다.
              </td>
            </tr>
          `
          }
        </tbody>
      </table>
    </div>

    <!-- 합계 정보 -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="section">
      <h3 class="section-header">합계 정보</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #6b7280; font-size: 12px;">합계 (한글)</span>
        <span style="font-weight: 500; font-size: 12px;">金 ${koreanAmount(
          document.content.total_amount
        )} 원整</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #6b7280; font-size: 12px;">합계 (숫자)</span>
        <span style="font-weight: 500; font-size: 14px;">₩ ${document.content.total_amount?.toLocaleString()}</span>
      </div>
      <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">* 부가세 별도</div>
    </div>

    <!-- 특기사항 -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="section">
      <h3 class="section-header">특기사항</h3>
      <div style="white-space: pre-line; color: #374151; font-size: 12px;">
        ${document.content.notes || "특기사항이 없습니다."}
      </div>
    </div>
  </div>
</body>
<script>
  window.onload = function () {
    setTimeout(function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }, 500);
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
          @font-face {
            font-family: 'NanumSquareNeo';
            src: url('/fonts/NanumSquareNeo-Variable.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          @page {
            size: A4; /* A4 크기 지정 */
            margin: 15mm 10mm 20mm 10mm; /* 상단, 우측, 하단, 좌측 여백 설정 */
          }
          body {
            margin: 0; 
            font-family: "NanumSquareNeo", sans-serif; 
            font-size: 12px !important;
          }
          /* 테이블 관련 설정 */
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          /* 테이블 헤더는 각 페이지에서 반복 */
          thead {
            display: table-header-group;
          }
          /* 테이블 행은 필요시 자연스럽게 나눠지도록 설정 */
          tr {
            page-break-inside: auto;
          }
          /* 테이블 푸터는 각 페이지 마지막에 표시 */
          tfoot {
            display: table-footer-group;
          }
          /* 페이지 나누기 방지가 필요한 요소 */
          .avoid-break {
            page-break-inside: avoid;
          }
          /* 기존 스타일은 유지 */
          .section-header {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 4px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          .section-content {
            padding: 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }
          .info-label {
            font-size: 11px;
            color: #6b7280;
            margin: 0 0 1px 0;
          }
          .info-value {
            font-weight: 500;
            font-size: 10px;
            margin: 0;
          }
          .address-line {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          /* 섹션 간 간격 조정 */
          .section {
            margin-bottom: 15px;
          }
          /* 페이지 내 요소들이 자연스럽게 흐르도록 설정 */
          .flow-content {
            page-break-inside: auto;
          }
        </style>
      </head>
      <body>
        <!-- 헤더 섹션 -->
        <div style="background: linear-gradient(to right, #047857, #065f46); color: white; padding: 15px 20px; border-radius: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">발주서</h2>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <div style="font-size: 14px; opacity: 0.9;">
              ${year}년 ${month}월 ${day}일
            </div>
            <div style="font-size: 14px; font-family: monospace;">
              ${document.document_number}
            </div>
          </div>
        </div>

        <div style="padding: 15px 20px;" class="flow-content">
          <!-- 회사 로고 및 정보 -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: center;">
              <!-- 로고 및 도장 -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <img src="/images/logo.png" alt="우양 신소재 로고" style="width: 250px; height: 40px; object-fit: contain;">
                <img src="/images/dojang.png" alt="도장" style="width: 35px; height: 35px; object-fit: contain;">
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- 본사 정보 -->
                <div>
                  <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">본사</p>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
                    <span style="font-size: 10px;" class="address-line">대구 북구 유통단지로 8길 21</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
                    <span style="font-size: 10px;">(053)383-5287</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
                    <span style="font-size: 10px;">(053)383-5283</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">홈</span>
                    <span style="font-size: 10px;">www.iwooyang.com</span>
                  </div>
                </div>
                
                <!-- 공장 정보 -->
                <div>
                  <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">공장</p>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
                    <span style="font-size: 10px;" class="address-line">구미시 산동면 첨단기업3로 81</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
                    <span style="font-size: 10px;">(054)476-3100</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
                    <span style="font-size: 10px;">(054)476-3104</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">메일</span>
                    <span style="font-size: 10px;">info@iwooyang.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 거래처 정보 및 문서 정보 -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;" class="section">
            <!-- 거래처 정보 -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <h3 class="section-header">거래처 정보</h3>
              <div class="info-grid">
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">회사명</p>
                    <p class="info-value">${document.content.company_name}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">담당자</p>
                    <p class="info-value">${document.contact_name} ${
        document.contact_level
      }</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">전화번호</p>
                    <p class="info-value">${company_phone || "정보 없음"}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">팩스</p>
                    <p class="info-value">${company_fax || "정보 없음"}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 문서 정보 -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <h3 class="section-header">문서 정보</h3>
              <div class="info-grid">
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">납기일자</p>
                    <p class="info-value">${document.content.delivery_date}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">결제방식</p>
                    <p class="info-value">${document.payment_method}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">발주자</p>
                    <p class="info-value">${document.user_name} ${
        document.user_level
      }</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 항목 테이블 -->
          <div style="margin-bottom: 15px;" class="section">
            <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #374151;">발주 항목</h3>
            <table>
              <thead>
                <tr>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">No</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">품명</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">규격</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">수량</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">단가</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">금액</th>
                </tr>
              </thead>
              <tbody>
                ${
                  document.content.items
                    ?.map(
                      (item: any, index: any) => `
                  <tr>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      index + 1
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: 500;">${
                      item.name
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      item.spec
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      item.quantity
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.unit_price?.toLocaleString()}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.amount?.toLocaleString()}</td>
                  </tr>
                `
                    )
                    .join("") ||
                  `
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 15px; color: #6b7280; border: 1px solid #e5e7eb; font-size: 12px;">
                      항목이 없습니다.
                    </td>
                  </tr>
                `
                }
              </tbody>
            </table>
          </div>

          <!-- 합계 정보 -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="section">
            <h3 class="section-header">합계 정보</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">합계 (한글)</span>
              <span style="font-weight: 500; font-size: 12px;">金 ${koreanAmount(
                document.content.total_amount
              )} 원整</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6b7280; font-size: 12px;">합계 (숫자)</span>
              <span style="font-weight: 500; font-size: 14px;">₩ ${document.content.total_amount?.toLocaleString()}</span>
            </div>
            <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">* 부가세 별도</div>
          </div>

          <!-- 특기사항 -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="section">
            <h3 class="section-header">특기사항</h3>
            <div style="white-space: pre-line; color: #374151; font-size: 12px;">
              ${document.content.notes || "특기사항이 없습니다."}
            </div>
          </div>
        </div>
      </body>
      <script>
        window.onload = function () {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 500);
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
          @font-face {
            font-family: 'NanumSquareNeo';
            src: url('/fonts/NanumSquareNeo-Variable.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          @page {
            size: A4; /* A4 크기 지정 */
            margin: 15mm 10mm 20mm 10mm; /* 상단, 우측, 하단, 좌측 여백 설정 */
          }
          body {
            margin: 0; 
            font-family: "NanumSquareNeo", sans-serif; 
            font-size: 12px !important;
          }
          /* 테이블 관련 설정 */
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          /* 테이블 헤더는 각 페이지에서 반복 */
          thead {
            display: table-header-group;
          }
          /* 테이블 행은 필요시 자연스럽게 나눠지도록 설정 */
          tr {
            page-break-inside: auto;
          }
          /* 테이블 푸터는 각 페이지 마지막에 표시 */
          tfoot {
            display: table-footer-group;
          }
          /* 페이지 나누기 방지가 필요한 요소 */
          .avoid-break {
            page-break-inside: avoid;
          }
          /* 기존 스타일은 유지 */
          .section-header {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 4px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          .section-content {
            padding: 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }
          .info-label {
            font-size: 11px;
            color: #6b7280;
            margin: 0 0 1px 0;
          }
          .info-value {
            font-weight: 500;
            font-size: 10px;
            margin: 0;
          }
          .address-line {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          /* 섹션 간 간격 조정 */
          .section {
            margin-bottom: 15px;
          }
          /* 페이지 내 요소들이 자연스럽게 흐르도록 설정 */
          .flow-content {
            page-break-inside: auto;
          }
        </style>
      </head>
      <body>
        <!-- 헤더 섹션 -->
        <div style="background: linear-gradient(to right, #7e22ce, #6b21a8); color: white; padding: 15px 20px; border-radius: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">견적의뢰서</h2>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <div style="font-size: 14px; opacity: 0.9;">
              ${year}년 ${month}월 ${day}일
            </div>
            <div style="font-size: 14px; font-family: monospace;">
              ${document.document_number}
            </div>
          </div>
        </div>

        <div style="padding: 15px 20px;" class="flow-content">
          <!-- 회사 로고 및 정보 -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="avoid-break">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: center;">
              <!-- 로고 및 도장 -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <img src="/images/logo.png" alt="우양 신소재 로고" style="width: 250px; height: 40px; object-fit: contain;">
                <img src="/images/dojang.png" alt="도장" style="width: 35px; height: 35px; object-fit: contain;">
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- 본사 정보 -->
                <div>
                  <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">본사</p>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
                    <span style="font-size: 10px;" class="address-line">대구 북구 유통단지로 8길 21</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
                    <span style="font-size: 10px;">(053)383-5287</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
                    <span style="font-size: 10px;">(053)383-5283</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">홈</span>
                    <span style="font-size: 10px;">www.iwooyang.com</span>
                  </div>
                </div>
                
                <!-- 공장 정보 -->
                <div>
                  <p style="font-size: 12px; font-weight: 600; margin: 0 0 3px 0;">공장</p>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">주소</span>
                    <span style="font-size: 10px;" class="address-line">구미시 산동면 첨단기업3로 81</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">TEL</span>
                    <span style="font-size: 10px;">(054)476-3100</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">FAX</span>
                    <span style="font-size: 10px;">(054)476-3104</span>
                  </div>
                  <div style="margin-bottom: 3px;">
                    <span style="font-size: 10px; color: #6b7280; width: 40px; display: inline-block;">메일</span>
                    <span style="font-size: 10px;">info@iwooyang.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 거래처 정보 및 문서 정보 -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;" class="section">
            <!-- 거래처 정보 -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <h3 class="section-header">거래처 정보</h3>
              <div class="info-grid">
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">회사명</p>
                    <p class="info-value">${document.content.company_name}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">담당자</p>
                    <p class="info-value">${document.contact_name} ${
        document.contact_level
      }</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">전화번호</p>
                    <p class="info-value">${company_phone || "정보 없음"}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">팩스</p>
                    <p class="info-value">${company_fax || "정보 없음"}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 문서 정보 -->
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 0; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <h3 class="section-header">문서 정보</h3>
              <div class="info-grid">
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">희망견적일</p>
                    <p class="info-value">${document.content.delivery_date}</p>
                  </div>
                </div>
                <div style="margin-bottom: 3px;">
                  <div>
                    <p class="info-label">의뢰자</p>
                    <p class="info-value">${document.user_name} ${
        document.user_level
      }</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 항목 테이블 -->
          <div style="margin-bottom: 15px;" class="section">
            <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #374151;">의뢰 항목</h3>
            <table>
              <thead>
                <tr>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">No</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">품명</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">규격</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">수량</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">단위</th>
                  <th style="background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">비고</th>
                </tr>
              </thead>
              <tbody>
                ${
                  document.content.items
                    ?.map(
                      (item: any, index: any) => `
                  <tr>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      index + 1
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px; font-weight: 500;">${
                      item.name
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      item.spec
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      item.quantity
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">${
                      item.unit || "-"
                    }</td>
                    <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-size: 12px;">-</td>
                  </tr>
                `
                    )
                    .join("") ||
                  `
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 15px; color: #6b7280; border: 1px solid #e5e7eb; font-size: 12px;">
                      항목이 없습니다.
                    </td>
                  </tr>
                `
                }
              </tbody>
            </table>
          </div>

          <!-- 특기사항 -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" class="section">
            <h3 class="section-header">특기사항</h3>
            <div style="white-space: pre-line; color: #374151; font-size: 12px;">
              ${document.content.notes || "특기사항이 없습니다."}
            </div>
          </div>
        </div>
      </body>
      <script>
        window.onload = function () {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 500);
        };
      </script>
      </html>
    `);
      printWindow.document.close();
    }
  };

  // 문서 타입에 따른 제목 설정
  const getDocumentTitle = () => {
    switch (type) {
      case "estimate":
        return "견적서";
      case "order":
        return "발주서";
      case "requestQuote":
        return "견적의뢰서";
      default:
        return "문서";
    }
  };

  // 문서 타입에 따른 색상 테마 설정
  const getThemeColor = () => {
    switch (type) {
      case "estimate":
        return "bg-gradient-to-r from-blue-600 to-blue-800";
      case "order":
        return "bg-gradient-to-r from-green-600 to-green-800";
      case "requestQuote":
        return "bg-gradient-to-r from-purple-600 to-purple-800";
      default:
        return "bg-gradient-to-r from-gray-600 to-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 섹션 */}
        <div
          className={`${getThemeColor()} text-white p-6 rounded-t-lg relative`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2" size={24} />
              {getDocumentTitle()}
            </h2>
            <div className="flex items-center space-x-2 z-50">
              <button
                onClick={handlePrint}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                title="인쇄하기"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                title="닫기"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-white/90">
            <div className="flex items-center">
              <Calendar className="mr-2" size={16} />
              <span>
                {year}년 {month}월 {day}일
              </span>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <span className="font-mono">{document.document_number}</span>
            </div>
          </div>
        </div>

        {/* 본문 섹션 */}
        <div className="p-6">
          {/* 회사 로고 및 정보 */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "15px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                alignItems: "center",
              }}
            >
              {/* 로고 및 도장 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "15px",
                }}
              >
                <div className="relative">
                  <Image
                    src="/images/logo.png"
                    alt="우양 신소재 로고"
                    width={350}
                    height={15}
                    className="object-contain"
                    style={{ height: "40px", objectFit: "contain" }}
                  />
                </div>
                <Image
                  src="/images/dojang.png"
                  alt="도장"
                  width={35}
                  height={35}
                  className="object-contain"
                  style={{
                    width: "35px",
                    height: "35px",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {/* 본사 정보 */}
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      margin: "0 0 3px 0",
                    }}
                  >
                    본사
                  </p>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      주소
                    </span>
                    <span style={{ fontSize: "10px" }}>
                      대구 북구 유통단지로 8길 21
                    </span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      TEL
                    </span>
                    <span style={{ fontSize: "10px" }}>(053)383-5287</span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      FAX
                    </span>
                    <span style={{ fontSize: "10px" }}>(053)383-5283</span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      홈
                    </span>
                    <span style={{ fontSize: "10px" }}>www.iwooyang.com</span>
                  </div>
                </div>

                {/* 공장 정보 */}
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      margin: "0 0 3px 0",
                    }}
                  >
                    공장
                  </p>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      주소
                    </span>
                    <span style={{ fontSize: "10px" }}>
                      구미시 산동면 첨단기업3로 81
                    </span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      TEL
                    </span>
                    <span style={{ fontSize: "10px" }}>(054)476-3100</span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      FAX
                    </span>
                    <span style={{ fontSize: "10px" }}>(054)476-3104</span>
                  </div>
                  <div style={{ marginBottom: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        width: "40px",
                        display: "inline-block",
                      }}
                    >
                      메일
                    </span>
                    <span style={{ fontSize: "10px" }}>info@iwooyang.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 거래처 정보 및 문서 정보 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            {/* 좌측: 거래처 정보 */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                padding: "15px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "0 0 4px 0",
                  paddingBottom: "4px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#374151",
                }}
              >
                거래처 정보
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                }}
              >
                <div style={{ marginBottom: "3px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        margin: "0 0 1px 0",
                      }}
                    >
                      회사명
                    </p>
                    <p
                      style={{
                        fontWeight: "500",
                        fontSize: "12px",
                        margin: "0",
                      }}
                    >
                      {document.content.company_name}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "3px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        margin: "0 0 1px 0",
                      }}
                    >
                      담당자
                    </p>
                    <p
                      style={{
                        fontWeight: "500",
                        fontSize: "12px",
                        margin: "0",
                      }}
                    >
                      {document.contact_name} {document.contact_level}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "3px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        margin: "0 0 1px 0",
                      }}
                    >
                      전화번호
                    </p>
                    <p
                      style={{
                        fontWeight: "500",
                        fontSize: "12px",
                        margin: "0",
                      }}
                    >
                      {company_phone || "정보 없음"}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "3px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        margin: "0 0 1px 0",
                      }}
                    >
                      팩스
                    </p>
                    <p
                      style={{
                        fontWeight: "500",
                        fontSize: "12px",
                        margin: "0",
                      }}
                    >
                      {company_fax || "정보 없음"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 문서 정보 */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                padding: "15px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "0 0 4px 0",
                  paddingBottom: "4px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#374151",
                }}
              >
                문서 정보
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                }}
              >
                {type === "estimate" && (
                  <>
                    <div style={{ marginBottom: "3px" }}>
                      <div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 1px 0",
                          }}
                        >
                          유효기간
                        </p>
                        <p
                          style={{
                            fontWeight: "500",
                            fontSize: "10px",
                            margin: "0",
                          }}
                        >
                          {document.content.valid_until}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: "3px" }}>
                      <div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 1px 0",
                          }}
                        >
                          납품일
                        </p>
                        <p
                          style={{
                            fontWeight: "500",
                            fontSize: "10px",
                            margin: "0",
                          }}
                        >
                          {document.content.delivery_term}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: "3px" }}>
                      <div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 1px 0",
                          }}
                        >
                          납품장소
                        </p>
                        <p
                          style={{
                            fontWeight: "500",
                            fontSize: "10px",
                            margin: "0",
                          }}
                        >
                          {document.content.delivery_place}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {type === "order" && (
                  <>
                    <div style={{ marginBottom: "3px" }}>
                      <div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 1px 0",
                          }}
                        >
                          납기일자
                        </p>
                        <p
                          style={{
                            fontWeight: "500",
                            fontSize: "10px",
                            margin: "0",
                          }}
                        >
                          {document.content.delivery_date}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {type === "requestQuote" && (
                  <>
                    <div style={{ marginBottom: "3px" }}>
                      <div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 1px 0",
                          }}
                        >
                          희망견적일
                        </p>
                        <p
                          style={{
                            fontWeight: "500",
                            fontSize: "10px",
                            margin: "0",
                          }}
                        >
                          {document.content.delivery_date}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {type !== "requestQuote" && (
                  <div style={{ marginBottom: "3px" }}>
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          margin: "0 0 1px 0",
                        }}
                      >
                        결제방식
                      </p>
                      <p
                        style={{
                          fontWeight: "500",
                          fontSize: "10px",
                          margin: "0",
                        }}
                      >
                        {document.payment_method}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "3px" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        margin: "0 0 1px 0",
                      }}
                    >
                      {type === "estimate"
                        ? "견적자"
                        : type === "order"
                        ? "발주자"
                        : "의뢰자"}
                    </p>
                    <p
                      style={{
                        fontWeight: "500",
                        fontSize: "10px",
                        margin: "0",
                      }}
                    >
                      {document.user_name} {document.user_level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 항목 테이블 */}
          <div style={{ marginBottom: "15px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#374151",
              }}
            >
              {type === "estimate"
                ? "견적 항목"
                : type === "order"
                ? "발주 항목"
                : "의뢰 항목"}
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "20px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      No
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      품명
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      규격
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      수량
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {type === "requestQuote" ? "단위" : "단가"}
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {type === "requestQuote" ? "비고" : "금액"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {document.content.items?.map((item: any, index: any) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: "#ffffff",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          fontWeight: "500",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {item.spec}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {type !== "requestQuote"
                          ? item.unit_price?.toLocaleString()
                          : item.unit || "-"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {type !== "requestQuote"
                          ? item.amount?.toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}

                  {!document.content.items?.length && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "15px",
                          textAlign: "center",
                          color: "#6b7280",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        항목이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 합계 정보 */}
          {type !== "requestQuote" && (
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#374151",
                }}
              >
                합계 정보
              </h3>
              <div
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  합계 (한글)
                </span>
                <span style={{ fontWeight: "500", fontSize: "12px" }}>
                  金 {koreanAmount(document.content.total_amount)} 원整
                </span>
              </div>
              <div
                style={{
                  marginBottom: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#6b7280", fontSize: "12px" }}>
                  합계 (숫자)
                </span>
                <span style={{ fontWeight: "500", fontSize: "14px" }}>
                  ₩ {document.content.total_amount?.toLocaleString()}
                </span>
              </div>
              <div
                style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}
              >
                * 부가세 별도
              </div>
            </div>
          )}

          {/* 특기사항 */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                paddingBottom: "6px",
                borderBottom: "1px solid #e5e7eb",
                color: "#374151",
              }}
            >
              특기사항
            </h3>
            <div
              style={{
                whiteSpace: "pre-line",
                color: "#374151",
                fontSize: "12px",
              }}
            >
              {document.content.notes ? (
                formatContentWithLineBreaks(document.content.notes)
              ) : (
                <p style={{ color: "#6b7280", fontStyle: "italic" }}>
                  특기사항이 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e5e7eb",
                color: "#374151",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={16} />
              닫기
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: "8px 16px",
                background: getThemeColor().replace("bg-", ""),
                color: "white",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Printer size={16} />
              인쇄하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
