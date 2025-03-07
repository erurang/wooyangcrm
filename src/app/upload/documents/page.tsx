"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { createSupabaseClient } from "@/utils/supabase/client";

// 🔹 hooks (SWR 등)
import { useAddDocument } from "@/hooks/documents/useAddDocument";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useUsersList } from "@/hooks/useUserList";
import { useAddConsultation } from "@/hooks/consultations/useAddConsultation";
import { useAssignConsultationContact } from "@/hooks/consultations/useAssignConsultationContact";

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

// 회사, 담당자, 유저 예시
interface Company {
  id: string;
  name: string;
}
interface Contact {
  id: string;
  contact_name: string;
  level: string;
}
interface User {
  id: string;
  name: string;
  level: string;
}

export default function ExcelEstimatePage() {
  // 🔹 엑셀에서 파싱된 여러 건의 견적서 문서
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  // 현재 선택된 문서 index
  const [currentDocIndex, setCurrentDocIndex] = useState<number>(0);

  // 🔹 검색된 회사 정보
  const [company, setCompany] = useState<Company>({ id: "", name: "" });

  // 🔹 담당자 / 유저 목록
  const { users } = useUsersList();
  const { contacts } = useContactsByCompany([company.id]);
  const { addConsultation } = useAddConsultation();
  const { assignConsultationContact } = useAssignConsultationContact();

  // 문서 DB 저장 훅
  const { addDocument } = useAddDocument();

  // 모달
  const [openModal, setOpenModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<DocumentData | null>(null);

  // 선택된 담당자 / 유저
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // 토스트 메시지
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 🔹 파일 업로드 & 엑셀 파싱
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const sheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
      }) as string[][];

      // (1) 첫 행에서 회사명 추출
      const extractedCompanyName = sheetData?.[0]?.[1] || "회사이름미지정";

      // 🔹 회사 검색 & state 저장
      await searchCompany(extractedCompanyName);

      // (2) 날짜별 Map
      type RowData = { docNote: string; items: Item[] };
      const dateMap = new Map<string, RowData>();

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0) continue;

        const dateVal = row[0]; // A열
        const account = row[1]; // B열
        const productName = row[2];
        const spec = row[3];
        const note = row[4];
        const qtyRaw = row[5];
        const unitPriceRaw = row[6];
        const totalAmtRaw = row[7];

        if (account !== "외출") continue;

        const qty = Number(qtyRaw || 0);
        const unitPrice = Number(unitPriceRaw || 0);
        const totalAmt = Number(totalAmtRaw || 0);

        const docNote = typeof note === "string" ? note : "";

        const item: Item = {
          name: typeof productName === "string" ? productName.trim() : "",
          spec: typeof spec === "string" ? spec.trim() : "",
          quantity: qty,
          unit_price: unitPrice,
          amount: totalAmt,
        };

        if (!dateMap.has(dateVal)) {
          dateMap.set(dateVal, { docNote, items: [item] });
        } else {
          const existingData = dateMap.get(dateVal)!;
          existingData.items.push(item);
          dateMap.set(dateVal, existingData);
        }
      }

      // (3) dateMap -> documents
      const tempDocs: DocumentData[] = [];
      for (const [dateVal, { docNote, items }] of dateMap.entries()) {
        const totalAmt = items.reduce((sum, it) => sum + it.amount, 0);

        const doc: DocumentData = {
          date: dateVal,
          items,
          company_name: extractedCompanyName,
          total_amount: totalAmt,
          delivery_date: dateVal,
          payment_method: "정기결제",
          notes: docNote || "",
        };
        tempDocs.push(doc);
      }

      setDocuments(tempDocs);
      setCurrentDocIndex(0);
    } catch (error) {
      console.error("엑셀 파싱 오류:", error);
      setSnackbarMessage("엑셀 파싱 중 오류 발생");
    }
  };

  // 🔹 회사 검색 함수
  const searchCompany = async (companyName: string) => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("name", companyName)
      .single();

    if (!error && data) {
      setCompany({ id: data.id, name: data.name });
    } else {
      setCompany({ id: "", name: companyName }); // 검색 안 되면 id는 ""로
    }
  };

  // 🔹 페이지 번호
  const pageNumbers = Array.from({ length: documents.length }, (_, i) => i);

  // 🔹 문서 선택
  const handleSelectDocIndex = (idx: number) => {
    setCurrentDocIndex(idx);
  };

  // 🔹 "견적서 보기" 모달 열기
  const openEstimateModal = () => {
    if (documents.length === 0) {
      setSnackbarMessage("엑셀 업로드된 문서가 없습니다.");
      return;
    }
    const doc = documents[currentDocIndex];
    setCurrentDoc(doc);
    // 담당자/유저 선택 초기화
    setSelectedContactId("");
    setSelectedUserId("");
    setOpenModal(true);
  };

  // 🔹 모달 닫기
  const closeModal = () => {
    setOpenModal(false);
    setCurrentDoc(null);
  };

  // **핵심**: handleUploadToDB (기존 handleAddDocument 로직 통합)
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadToDB = async () => {
    if (!currentDoc) return;
    if (!selectedContactId) {
      setSnackbarMessage("담당자를 선택해주세요.");
      return;
    }
    if (!selectedUserId) {
      setSnackbarMessage("견적자를 선택해주세요.");
      return;
    }

    // 예시로 type을 "estimate"로 고정
    const type = "estimate";

    // 🔹 여기서 기존 handleAddDocument 로직 적용
    // 예: 필수 필드 검증
    setIsUploading(true);

    try {
      // itemsData 변환
      const itemsData = currentDoc.items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      const content = {
        items: itemsData,
        company_name: currentDoc.company_name,
        total_amount: currentDoc.total_amount,
        payment_method: currentDoc.payment_method,
        notes: currentDoc.notes,
        delivery_date: currentDoc.delivery_date, // 예: estimate는 납품일 or valid_until 등
      };

      const addedConsultation = await addConsultation({
        method: "POST",
        body: {
          date: `20${currentDoc?.date.replaceAll(".", "-")}`,
          company_id: company.id || "",
          content: `경영박사 엑셀파일 업로드 / ${currentDoc?.notes}`,
          follow_up_date: null,
          user_id: selectedUserId,
        },
      });

      await assignConsultationContact({
        method: "POST",
        body: {
          consultation_id: addedConsultation.consultation_id,
          contact_id: selectedContactId,
          user_id: selectedUserId,
        },
      });

      // 🔹 DB 업로드
      const addedDocument = await addDocument({
        method: "POST",
        body: {
          content,
          date: `20${currentDoc?.date.replaceAll(".", "-")}`,
          user_id: selectedUserId,
          payment_method: currentDoc.payment_method,
          consultation_id: addedConsultation.consultation_id, // 필요하면 설정
          company_id: company.id, // 검색된 회사 ID
          type,
          contact_id: selectedContactId,
        },
      });

      if (!addedDocument?.document) {
        throw new Error("문서 추가 실패");
      }

      setSnackbarMessage("문서가 업로드(생성)되었습니다.");

      // **중요**: 업로드 성공 시, 해당 문서를 documents에서 제거 → 재업로드 불가
      setDocuments((prev) => prev.filter((_, i) => i !== currentDocIndex));

      // 모달 닫고, currentDocIndex를 0으로 리셋 (또는 다음 문서가 있다면 조정)
      setCurrentDocIndex(0);
      setOpenModal(false);
      setCurrentDoc(null);
    } catch (error) {
      console.error("문서 추가 중 오류:", error);
      setSnackbarMessage("문서 추가 중 오류 발생");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">엑셀 업로드 + 견적서</h1>
      <input type="file" onChange={handleFileUpload} className="mb-4" />

      {/* 문서가 여러 건이면 페이지 번호 표시 */}
      {documents.length > 0 && (
        <div className="flex space-x-2 mb-4">
          {pageNumbers.map((idx) => (
            <button
              key={idx}
              onClick={() => handleSelectDocIndex(idx)}
              className={`px-3 py-1 border rounded ${
                idx === currentDocIndex ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* 현재 선택된 문서 정보 간단 표시 */}
      {documents.length > 0 && (
        <div className="mb-4">
          <p>
            현재 문서: {currentDocIndex + 1} / {documents.length}
          </p>
          <p>회사명: {documents[currentDocIndex].company_name}</p>
          <p>날짜: {documents[currentDocIndex].date}</p>
          <p>품목 개수: {documents[currentDocIndex].items.length}</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={openEstimateModal}
          >
            견적서 보기
          </button>
        </div>
      )}

      {/* 모달 */}
      {openModal && currentDoc && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-2/3 max-w-6xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">견적서 보기</h3>
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={closeModal}
              >
                닫기
              </button>
            </div>

            {/* 회사명, 날짜, 결제조건 등 */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">회사명</label>
                <input
                  type="text"
                  value={currentDoc.company_name}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">견적일</label>
                <input
                  type="text"
                  value={currentDoc.date}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">납품일</label>
                <input
                  type="text"
                  value={currentDoc.delivery_date}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  결제조건
                </label>
                <input
                  type="text"
                  value={currentDoc.payment_method}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* 담당자(contacts), 유저(users) 선택 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">담당자</label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">선택</option>
                  {contacts.map((contact: any) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.contact_name} ({contact.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">견적자</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">선택</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 특기사항 */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">특기사항</label>
              <textarea
                value={currentDoc.notes}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>

            {/* 아이템 목록 */}
            <div className="mb-4 max-h-96 overflow-y-scroll">
              <label className="block mb-1 text-sm font-medium">품목</label>
              <div className="space-y-2 mt-2">
                {currentDoc.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={item.name}
                      readOnly
                      className="col-span-4 px-1 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={item.spec}
                      readOnly
                      className="col-span-3 px-1 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={item.quantity}
                      readOnly
                      className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={item.unit_price.toLocaleString()}
                      readOnly
                      className="col-span-2 px-1 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="text"
                      value={item.amount.toLocaleString()}
                      readOnly
                      className="col-span-1 px-1 border border-gray-300 rounded-md text-sm bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 총액 */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">총액</label>
              <input
                type="text"
                value={currentDoc.total_amount.toLocaleString()}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
              />
            </div>

            {/* 버튼들 */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                닫기
              </button>
              <button
                onClick={handleUploadToDB}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {snackbarMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md">
          {snackbarMessage}
          <button
            className="ml-2 text-sm"
            onClick={() => setSnackbarMessage("")}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
