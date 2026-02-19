"use client";

import Image from "next/image";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount?: number;
}

interface PreviewDocument {
  id: string;
  type: string;
  document_number: string;
  date?: string | null;
  content?: {
    items?: DocumentItem[];
  };
  company_name?: string | null;
  total_amount?: number | null;
  delivery_date?: string | null;
  delivery_date_note?: string | null; // 납기일 표시용 비고 (빠른시일내 등)
  valid_until?: string | null;
  delivery_place?: string | null;
  delivery_term?: string | null;
  notes?: string | null;
  contact_name?: string | null;
  contact_level?: string | null;
  user_name?: string | null;
  user_level?: string | null;
  payment_method?: string | null;
}

interface DocumentPreviewProps {
  document: PreviewDocument;
  type: string;
  company_phone?: string;
  company_fax?: string;
  koreanAmount: (amount: number) => string;
  onClose: () => void;
  onPrint: () => void;
  hideActions?: boolean;
}

const formatContentWithLineBreaks = (content: string) => {
  return content?.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));
};

function DocumentHeader({
  title,
  document,
  year,
  month,
  day,
}: {
  title: string;
  document: PreviewDocument;
  year: number;
  month: number;
  day: number;
}) {
  return (
    <div className="flex justify-center relative">
      <h1 className="font-bold text-4xl">{title}</h1>
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
  );
}

function CompanySection() {
  return (
    <div className="col-span-2 space-y-2 ml-12 hidden md:block">
      <div className="flex items-center space-x-6">
        <Image src={"/images/logo.gif"} width="55" height="55" alt="logo" />
        <span className="font-bold text-xl">우 양 신 소 재</span>
        <Image src={"/images/dojang.gif"} width="55" height="55" alt="logo" />
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
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative">
      <p>
        {label} : {value}
      </p>
      <div className="absolute -bottom-1 border-b-[1px] border-black w-full border-dotted"></div>
    </div>
  );
}

function ItemsTable({
  items,
  showPrice = true,
}: {
  items: DocumentItem[];
  showPrice?: boolean;
}) {
  return (
    <table className="min-w-full table-auto border-collapse text-center mt-6">
      <thead>
        <tr className="bg-slate-100 text-left border-black border-2">
          <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
            No
          </th>
          <th className="px-4 py-2 border-black border-r-[1px] text-center w-5/12">
            품명
          </th>
          <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
            규격
          </th>
          <th className="px-4 py-2 border-black border-r-[1px] text-center w-1/12">
            수량
          </th>
          <th className="px-4 py-2 border-black border-r-[1px] text-center">
            {showPrice ? "단가" : "단위"}
          </th>
          <th className="px-4 py-2 border-black border-r-[1px] text-center hidden md:table-cell">
            {showPrice ? "금액" : "비고"}
          </th>
        </tr>
      </thead>
      <tbody className="border-black border-2">
        {items?.map((item, index) => (
          <tr
            className="hover:bg-slate-50 border-b-[1px] border-black"
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
              {showPrice ? item.unit_price?.toLocaleString() : item.unit_price}
            </td>
            <td className="px-4 py-2 border-black border-r-[1px] hidden md:table-cell">
              {showPrice ? item.amount?.toLocaleString() : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SummarySection({
  totalAmount,
  koreanAmount,
  notes,
  showTotal = true,
}: {
  totalAmount?: number;
  koreanAmount?: (amount: number) => string;
  notes: string;
  showTotal?: boolean;
}) {
  return (
    <table className="min-w-full table-auto border-collapse text-center mt-6">
      {showTotal && totalAmount !== undefined && koreanAmount && (
        <thead>
          <tr className="text-left border-black border-2">
            <th className="px-4 py-2 border-black border-r-[1px] text-center">
              합계(VAT별도) : 金{koreanAmount(totalAmount)}원整 (₩
              {totalAmount?.toLocaleString()})
            </th>
          </tr>
        </thead>
      )}
      <tbody className="border-black border-2">
        <tr className="hover:bg-slate-50">
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
                  <p>{formatContentWithLineBreaks(notes)}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ActionButtons({
  onClose,
  onPrint,
}: {
  onClose: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex justify-end space-x-4 mt-4">
      <button
        onClick={onClose}
        className="bg-slate-500 text-white px-4 py-2 rounded-md text-sm"
      >
        닫기
      </button>
      <button
        onClick={onPrint}
        className="bg-sky-500 text-white px-4 py-2 rounded-md text-sm"
      >
        프린트
      </button>
    </div>
  );
}

export default function DocumentPreview({
  document,
  type,
  company_phone,
  company_fax,
  koreanAmount,
  onClose,
  onPrint,
  hideActions = false,
}: DocumentPreviewProps) {
  // 날짜가 없으면 현재 날짜 사용 (ISO timestamp에서 날짜 부분만 추출)
  const rawDate = document?.date || new Date().toISOString();
  const dateStr = rawDate.split("T")[0]; // "2026-01-15T06:54:53" -> "2026-01-15"
  const [year, month, day] = dateStr.split("-").map(Number);

  // 담당자 정보 (없으면 빈 문자열)
  const contactDisplay = document.contact_name
    ? `${document.contact_name} ${document.contact_level || ""}님`
    : "";

  const renderEstimate = () => (
    <>
      <DocumentHeader
        title={"견" + "  " + "적" + "  " + "서"}
        document={document}
        year={year}
        month={month}
        day={day}
      />
      <div className="mt-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
        <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
          <InfoField label="회사명" value={document.company_name || ""} />
          <InfoField label="담당자명" value={contactDisplay} />
          <InfoField label="TEL" value={company_phone || ""} />
          <InfoField label="FAX" value={company_fax || ""} />
          <InfoField label="유효기간" value={document.valid_until || ""} />
          <InfoField label="납품일" value={document.delivery_date_note || document.delivery_date || ""} />
          <InfoField label="결제방식" value={document.payment_method || ""} />
          <InfoField label="납품장소" value={document.delivery_place || ""} />
          <div className="mt-12 relative">
            <p>
              견적자 : {document.user_name} {document.user_level}
            </p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
          </div>
          <p>아래와 같이 견적합니다.</p>
        </div>
        <CompanySection />
      </div>
      <div>
        <ItemsTable items={document.content?.items || []} />
        <SummarySection
          totalAmount={document.total_amount ?? 0}
          koreanAmount={koreanAmount}
          notes={document.notes || ""}
        />
      </div>
      {!hideActions && <ActionButtons onClose={onClose} onPrint={onPrint} />}
    </>
  );

  const renderOrder = () => (
    <>
      <DocumentHeader
        title={"발" + "  " + "주" + "  " + "서"}
        document={document}
        year={year}
        month={month}
        day={day}
      />
      <div className="mt-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
        <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
          <InfoField label="회사명" value={document.company_name || ""} />
          <InfoField label="담당자명" value={contactDisplay} />
          <InfoField label="TEL" value={company_phone || ""} />
          <InfoField label="FAX" value={company_fax || ""} />
          <InfoField label="납기일자" value={document.delivery_date_note || document.delivery_date || ""} />
          <InfoField
            label="결제방식"
            value={document.payment_method || ""}
          />
          <div className="mt-12 relative">
            <p>
              발주자 : {document.user_name} {document.user_level}
            </p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
          </div>
          <p>아래와 같이 발주합니다.</p>
        </div>
        <CompanySection />
      </div>
      <div>
        <ItemsTable items={document.content?.items || []} />
        <SummarySection
          totalAmount={document.total_amount ?? 0}
          koreanAmount={koreanAmount}
          notes={document.notes || ""}
        />
      </div>
      {!hideActions && <ActionButtons onClose={onClose} onPrint={onPrint} />}
    </>
  );

  const renderRequestQuote = () => (
    <>
      <DocumentHeader
        title="견 적 의 뢰 서"
        document={document}
        year={year}
        month={month}
        day={day}
      />
      <div className="mt-10"></div>
      <div className="grid grid-cols-1 md:grid-cols-5 mt-12">
        <div className="col-span-3 space-y-2 font-semibold pr-0 md:pr-16">
          <InfoField label="회사명" value={document.company_name || ""} />
          <InfoField label="담당자명" value={contactDisplay} />
          <InfoField label="TEL" value={company_phone || ""} />
          <InfoField label="FAX" value={company_fax || ""} />
          <div className="mt-12 relative">
            <p>
              의뢰자 : {document.user_name} {document.user_level}
            </p>
            <div className="absolute -bottom-1 border-b-[1px] border-black w-full"></div>
          </div>
          <p>아래와 같이 견적을 의뢰합니다.</p>
        </div>
        <CompanySection />
      </div>
      <div>
        <ItemsTable items={document.content?.items || []} showPrice={false} />
        <SummarySection notes={document.notes || ""} showTotal={false} />
      </div>
      {!hideActions && <ActionButtons onClose={onClose} onPrint={onPrint} />}
    </>
  );

  return (
    <>
      {type === "estimate" && renderEstimate()}
      {type === "order" && renderOrder()}
      {type === "requestQuote" && renderRequestQuote()}
    </>
  );
}
