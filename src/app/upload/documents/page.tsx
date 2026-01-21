"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { createSupabaseClient } from "@/utils/supabase/client";

import { useAddDocument } from "@/hooks/documents/useAddDocument";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useUsersList } from "@/hooks/useUserList";
import { useAddConsultation } from "@/hooks/consultations/useAddConsultation";
import { useAssignConsultationContact } from "@/hooks/consultations/useAssignConsultationContact";

import {
  DocumentPagination,
  DocumentInfoCard,
  EstimateModal,
} from "@/components/upload/documents";
import SnackbarComponent from "@/components/Snackbar";

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

interface Company {
  id: string;
  name: string;
}

export default function ExcelEstimatePage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState<number>(0);
  const [company, setCompany] = useState<Company>({ id: "", name: "" });

  const { users } = useUsersList();
  const { contacts } = useContactsByCompany([company.id]);
  const { addConsultation } = useAddConsultation();
  const { assignConsultationContact } = useAssignConsultationContact();
  const { addDocument } = useAddDocument();

  const [openModal, setOpenModal] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<DocumentData | null>(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
      setCompany({ id: "", name: companyName });
    }
  };

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

      const extractedCompanyName = sheetData?.[0]?.[1] || "회사이름미지정";
      await searchCompany(extractedCompanyName);

      type RowData = { docNote: string; items: Item[] };
      const dateMap = new Map<string, RowData>();

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length === 0) continue;

        const dateVal = row[0];
        const account = row[1];
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

  const openEstimateModal = () => {
    if (documents.length === 0) {
      setSnackbarMessage("엑셀 업로드된 문서가 없습니다.");
      return;
    }
    const doc = documents[currentDocIndex];
    setCurrentDoc(doc);
    setSelectedContactId("");
    setSelectedUserId("");
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setCurrentDoc(null);
  };

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

    const type = "estimate";
    setIsUploading(true);

    try {
      const itemsData = currentDoc.items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      // content는 items만 포함 (API 스키마 변경에 맞춤)
      const content = {
        items: itemsData,
      };

      const addedConsultation = await addConsultation({
        method: "POST",
        body: {
          date: `20${currentDoc?.date.replaceAll(".", "-")}`,
          company_id: company.id || "",
          content: `경영박사 엑셀파일 업로드 / ${currentDoc?.notes}`,
          follow_up_date: null,
          user_id: selectedUserId,
          title: `[엑셀업로드] ${currentDoc?.company_name} 견적`,
          contact_method: "other",
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

      const addedDocument = await addDocument({
        method: "POST",
        body: {
          content,
          date: `20${currentDoc?.date.replaceAll(".", "-")}`,
          user_id: selectedUserId,
          payment_method: currentDoc.payment_method,
          consultation_id: addedConsultation.consultation_id,
          company_id: company.id,
          type,
          contact_id: selectedContactId,
          status: "completed",
          // 분리된 필드들 (스키마 변경에 맞춤)
          notes: currentDoc.notes || null,
          delivery_date: `20${currentDoc?.delivery_date.replaceAll(".", "-")}`,
          total_amount: currentDoc.total_amount,
        },
      });

      if (!addedDocument?.document) {
        throw new Error("문서 추가 실패");
      }

      setSnackbarMessage("문서가 업로드(생성)되었습니다.");
      setDocuments((prev) => prev.filter((_, i) => i !== currentDocIndex));
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

      <DocumentPagination
        totalPages={documents.length}
        currentIndex={currentDocIndex}
        onSelectIndex={setCurrentDocIndex}
      />

      {documents.length > 0 && (
        <DocumentInfoCard
          document={documents[currentDocIndex]}
          currentIndex={currentDocIndex}
          totalDocuments={documents.length}
          onViewEstimate={openEstimateModal}
        />
      )}

      <EstimateModal
        isOpen={openModal}
        document={currentDoc}
        contacts={contacts}
        users={users}
        selectedContactId={selectedContactId}
        selectedUserId={selectedUserId}
        onContactChange={setSelectedContactId}
        onUserChange={setSelectedUserId}
        onClose={closeModal}
        onUpload={handleUploadToDB}
        isUploading={isUploading}
      />

      <SnackbarComponent
        message={snackbarMessage}
        severity="info"
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
