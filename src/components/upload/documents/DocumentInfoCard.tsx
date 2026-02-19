"use client";

interface Item {
  name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface DocumentData {
  date: string;
  items: Item[];
  company_name: string;
  total_amount: number;
  delivery_date: string;
  payment_method: string;
  notes: string;
}

interface DocumentInfoCardProps {
  document: DocumentData;
  currentIndex: number;
  totalDocuments: number;
  onViewEstimate: () => void;
}

export default function DocumentInfoCard({
  document,
  currentIndex,
  totalDocuments,
  onViewEstimate,
}: DocumentInfoCardProps) {
  return (
    <div className="mb-4">
      <p>
        현재 문서: {currentIndex + 1} / {totalDocuments}
      </p>
      <p>회사명: {document.company_name}</p>
      <p>날짜: {document.date}</p>
      <p>품목 개수: {document.items.length}</p>
      <button
        className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-md"
        onClick={onViewEstimate}
      >
        견적서 보기
      </button>
    </div>
  );
}
