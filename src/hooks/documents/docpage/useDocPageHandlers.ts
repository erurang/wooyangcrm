import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DocumentItem {
  number?: number;
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
}

interface DocPageDocument {
  id: string;
  date: string;
  contact_name: string;
  contact_level: string;
  type: string;
  content: {
    items: DocumentItem[];
  };
  payment_method?: string;
  document_number: string;
  status: string;
  created_at: string;
  // 분리된 컬럼들 (optional for compatibility)
  notes?: string | null;
  valid_until?: string | null;
  delivery_date?: string | null;
  total_amount?: number;
  delivery_term?: string | null;
  delivery_place?: string | null;
}

interface StatusReason {
  completed?: { reason: string };
  canceled?: { reason: string };
}

interface AddDocumentParams {
  method: string;
  body: {
    date: string;
    content: { items: DocumentItem[] };
    user_id: string;
    payment_method: string;
    consultation_id: string;
    company_id: string;
    type: string;
    contact_id: string | undefined;
    notes: string;
    valid_until: string | null;
    delivery_date: string | null;
    total_amount: number;
    delivery_term: string | null;
    delivery_place: string | null;
  };
}

interface UpdateDocumentParams {
  method: string;
  body: {
    date: string;
    document_id: string;
    content: { items: DocumentItem[] };
    payment_method: string;
    contact_id: string | undefined;
    notes: string;
    valid_until: string | null;
    delivery_date: string | null;
    total_amount: number;
    delivery_term: string | null;
    delivery_place: string | null;
  };
}

interface UpdateStatusParams {
  id: string;
  status: string;
  status_reason: Record<string, { reason: string }>;
  updated_by?: string;
}

interface DocumentResponse {
  document?: DocPageDocument;
}

interface Contact {
  id: string;
  contact_name: string;
}

interface NewDocument {
  id: string;
  date: string;
  company_name: string;
  contact: string;
  phone: string;
  fax: string;
  created_at: string;
  valid_until: string;
  payment_method: string;
  notes: string;
  delivery_term: string;
  delivery_place: string;
  status: string;
  delivery_date: string;
}

interface UseDocPageHandlersProps {
  type: string;
  userId: string;
  consultationId: string;
  companyId: string;
  contacts: Contact[];
  items: DocumentItem[];
  totalAmount: number;
  addDocument: (params: AddDocumentParams) => Promise<DocumentResponse>;
  updateDocument: (params: UpdateDocumentParams) => Promise<DocumentResponse>;
  updateStatus: (params: UpdateStatusParams) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  isAdding: boolean;
  isUpdating: boolean;
}

export function useDocPageHandlers({
  type,
  userId,
  consultationId,
  companyId,
  contacts,
  items,
  totalAmount,
  addDocument,
  updateDocument,
  updateStatus,
  refreshDocuments,
  isAdding,
  isUpdating,
}: UseDocPageHandlersProps) {
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleConfirmDelete = useCallback(
    async (
      documentToDelete: DocPageDocument | null,
      deleteReason: string,
      onSuccess: () => void
    ) => {
      if (!documentToDelete || !deleteReason) return;

      try {
        const { error } = await supabase.from("deletion_requests").insert([
          {
            type: "documents",
            related_id: documentToDelete.id,
            status: "pending",
            request_date: new Date(),
            user_id: userId,
            delete_reason: deleteReason,
            content: {
              documents: `
              문서번호 : ${documentToDelete.document_number}/
              ${documentToDelete.type === "estimate" ? "견적서" : ""}${
                documentToDelete.type === "order" ? "발주서" : ""
              }${documentToDelete.type === "requestQuote" ? "의뢰서" : ""}삭제 :
              특기사항 : ${documentToDelete.notes || ""}/
              담당자 : ${documentToDelete.contact_name} ${documentToDelete.contact_level}/
              품목 : ${documentToDelete.content.items.map((n: DocumentItem) => n.name).join(", ")}
              `,
            },
          },
        ]);

        if (error) throw error;

        setSnackbarMessage("삭제 요청 완료");
        onSuccess();
      } catch (error) {
        console.error("Error deleting document:", error);
        setSnackbarMessage("삭제 요청 실패");
      }
    },
    [userId]
  );

  const handleAddDocument = useCallback(
    async (newDocument: NewDocument, onSuccess: () => void) => {
      if (isAdding) return;

      const {
        contact,
        payment_method,
        notes,
        date,
        valid_until,
        delivery_date,
        delivery_place,
        delivery_term,
      } = newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요.");
        return;
      }
      if ((type === "estimate" || type === "order") && !payment_method) {
        setSnackbarMessage("결제방식을 선택해주세요.");
        return;
      }
      if (type === "estimate" && !valid_until) {
        setSnackbarMessage("견적 만료일을 입력해주세요.");
        return;
      }
      if ((type === "order" || type === "requestQuote") && !delivery_date) {
        setSnackbarMessage("납품일을 입력해주세요.");
        return;
      }

      setSaving(true);

      const itemsData = items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount:
          item.unit_price *
          parseFloat(String(item.quantity).replace(/,/g, "") || "0"),
      }));

      // content는 items만 포함
      const content = { items: itemsData };

      try {
        const addedDocument = await addDocument({
          method: "POST",
          body: {
            date,
            content,
            user_id: userId,
            payment_method,
            consultation_id: consultationId,
            company_id: companyId,
            type,
            contact_id: contacts.find((c) => c.contact_name === contact)?.id,
            // 분리된 필드들
            notes,
            valid_until: type === "estimate" ? valid_until : null,
            delivery_date: type !== "estimate" ? delivery_date : null,
            total_amount: totalAmount,
            delivery_term: type === "estimate" ? delivery_term : null,
            delivery_place: type === "estimate" ? delivery_place : null,
          },
        });

        if (!addedDocument?.document) throw new Error("문서 추가 실패");

        setSnackbarMessage("문서가 생성되었습니다");
        onSuccess();
        await refreshDocuments();
      } catch (error) {
        setSnackbarMessage("문서 추가 중 오류 발생");
      } finally {
        setSaving(false);
      }
    },
    [
      type,
      userId,
      consultationId,
      companyId,
      contacts,
      items,
      totalAmount,
      addDocument,
      refreshDocuments,
      isAdding,
    ]
  );

  const handleEditDocument = useCallback(
    async (newDocument: NewDocument, onSuccess: () => void) => {
      if (isUpdating) return;

      const {
        contact,
        payment_method,
        notes,
        date,
        valid_until,
        delivery_date,
        delivery_place,
        delivery_term,
      } = newDocument;

      if (!contact) {
        setSnackbarMessage("담당자를 선택해주세요.");
        return;
      }
      if ((type === "estimate" || type === "order") && !payment_method) {
        setSnackbarMessage("결제방식을 선택해주세요.");
        return;
      }
      if (type === "estimate" && !valid_until) {
        setSnackbarMessage("견적 만료일을 입력해주세요.");
        return;
      }
      if ((type === "order" || type === "requestQuote") && !delivery_date) {
        setSnackbarMessage("납품일을 입력해주세요.");
        return;
      }

      setSaving(true);

      const itemsData = items.map((item, index) => ({
        number: index + 1,
        name: item.name,
        spec: item.spec,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount:
          item.unit_price *
          parseFloat(String(item.quantity).replace(/,/g, "") || "0"),
      }));

      // content는 items만 포함
      const content = { items: itemsData };

      try {
        const updatedDocument = await updateDocument({
          method: "PATCH",
          body: {
            date,
            document_id: newDocument.id,
            content,
            payment_method,
            contact_id: contacts.find((c) => c.contact_name === contact)?.id,
            // 분리된 필드들
            notes,
            valid_until: type === "estimate" ? valid_until : null,
            delivery_date: type !== "estimate" ? delivery_date : null,
            total_amount: totalAmount,
            delivery_term: type === "estimate" ? delivery_term : null,
            delivery_place: type === "estimate" ? delivery_place : null,
          },
        });

        if (!updatedDocument?.document) throw new Error("문서 수정 실패");

        setSnackbarMessage("문서가 수정되었습니다");
        onSuccess();
        await refreshDocuments();
      } catch (error) {
        setSnackbarMessage("문서 수정 중 오류 발생");
      } finally {
        setSaving(false);
      }
    },
    [
      type,
      contacts,
      items,
      totalAmount,
      updateDocument,
      refreshDocuments,
      isUpdating,
    ]
  );

  const handleStatusChange = useCallback(
    async (
      statusChangeDoc: DocPageDocument | null,
      selectedStatus: string,
      statusReason: StatusReason,
      onSuccess: () => void
    ) => {
      if (!statusChangeDoc || !selectedStatus) return;

      const confirmChange = window.confirm(
        "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
      );
      if (!confirmChange) return;

      try {
        const reasonText =
          statusReason[selectedStatus as "completed" | "canceled"]?.reason ||
          "";
        const reason = {
          [selectedStatus]: { reason: reasonText },
        };

        await updateStatus({
          id: statusChangeDoc.id,
          status: selectedStatus,
          status_reason: reason,
          updated_by: userId, // 알림 전송용
        });

        setSnackbarMessage("문서 상태가 변경되었습니다.");
        onSuccess();
        await refreshDocuments();
      } catch (error) {
        setSnackbarMessage("상태 변경 중 오류 발생");
      }
    },
    [updateStatus, refreshDocuments]
  );

  return {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleConfirmDelete,
    handleAddDocument,
    handleEditDocument,
    handleStatusChange,
  };
}
