import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 알림 생성 함수
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string,
  relatedType: string
) {
  try {
    const { error } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        read: false,
      },
    ]);

    if (error) {
      console.error("알림 생성 실패:", error);
    }
  } catch (e) {
    console.error("알림 생성 예외:", e);
  }
}

// 상태 한글 변환
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "대기",
    completed: "완료",
    canceled: "취소",
    expired: "만료",
  };
  return statusMap[status] || status;
}

/**
 * GET /api/documents/status
 * 문서 상태별 목록 조회
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId") || null;
  const type = searchParams.get("type") || "estimate";
  const status = searchParams.get("status") || "all";
  const docNumber = searchParams.get("docNumber") || "";
  const companyIds = searchParams.getAll("companyIds");
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const notes = searchParams.get("notes") || "";
  const documentId = searchParams.get("documentId") || null;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    // 특정 문서 ID로 검색하는 경우 (highlight용)
    if (documentId) {
      const { data: singleDoc, error: singleError } = await supabase
        .from("documents")
        .select(
          `*, contacts_documents(contacts(contact_name, level, mobile)), users(name, level), companies(name, phone, fax)`
        )
        .eq("id", documentId)
        .single();

      if (singleError) throw singleError;

      if (singleDoc) {
        const contact = singleDoc.contacts_documents?.[0]?.contacts || {};
        const user = singleDoc.users || {};
        const company = singleDoc.companies || {};

        const transformedDoc = {
          ...singleDoc,
          contact_level: contact.level || "",
          contact_name: contact.contact_name || "",
          contact_mobile: contact.mobile || "",
          user_name: user.name || "",
          user_level: user.level || "",
          company_name: company.name || "",
          company_phone: company.phone || "",
          company_fax: company.fax || "",
          contacts_documents: undefined,
          users: undefined,
        };

        return NextResponse.json(
          { documents: [transformedDoc], total: 1 },
          { status: 200 }
        );
      }
    }

    // 상담 데이터 쿼리 생성
    let query = supabase
      .from("documents")
      .select(
        `*, contacts_documents(contacts(contact_name, level, mobile)), users(name, level), companies(name, phone, fax)`,
        { count: "exact" }
      )
      .eq("type", type)
      .order("date", { ascending: false })
      .range(start, end);

    // 상태 필터 추가
    if (status === "expiring_soon") {
      const today = new Date();
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split("T")[0];
      const sevenDaysLaterStr = sevenDaysLater.toISOString().split("T")[0];

      query = query
        .eq("status", "pending")
        .not("valid_until", "is", null)
        .gte("valid_until", todayStr)
        .lte("valid_until", sevenDaysLaterStr);
    } else if (status !== "all") {
      query = query.eq("status", status);
    }

    if (docNumber) {
      query = query.ilike("document_number", `%${docNumber}%`);
    }

    if (notes) {
      query = query.ilike("content->>notes", `%${notes}%`);
    }

    if (userId) query = query.eq("user_id", userId);
    if (companyIds.length > 0) query = query.in("company_id", companyIds);

    const { data, error, count } = await query;
    if (error) throw error;

    const transformedDocuments = data.map((doc) => {
      const contact = doc.contacts_documents?.[0]?.contacts || {};
      const user = doc.users || {};
      const company = doc.companies || {};

      return {
        ...doc,
        contact_level: contact.level || "",
        contact_name: contact.contact_name || "",
        contact_mobile: contact.mobile || "",
        user_name: user.name || "",
        user_level: user.level || "",
        company_name: company.name || "",
        company_phone: company.phone || "",
        company_fax: company.fax || "",
        contacts_documents: undefined,
        users: undefined,
      };
    });

    return NextResponse.json(
      { documents: transformedDocuments, total: count },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/status
 * 문서 상태 변경
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, status_reason, updated_by } = await req.json();

    if (!id || !status || !status_reason) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { data: document } = await supabase
      .from("documents")
      .select(
        `
        user_id,
        document_number,
        type,
        status,
        company:companies(name)
      `
      )
      .eq("id", id)
      .single();

    const oldStatus = document?.status;
    const companyName =
      (document?.company as { name?: string })?.name || "거래처";

    // status_reason 데이터 정제
    const sanitizedStatusReason: Record<
      string,
      { reason: string; amount: number }
    > = {};

    for (const key in status_reason) {
      if (status_reason[key]) {
        sanitizedStatusReason[key] = {
          reason: status_reason[key].reason || "",
          amount:
            status_reason[key].amount !== undefined &&
            status_reason[key].amount !== ""
              ? status_reason[key].amount
              : 0,
        };
      }
    }

    const { error } = await supabase
      .from("documents")
      .update({ status, status_reason: sanitizedStatusReason })
      .eq("id", id);

    if (error) throw error;

    // 문서 작성자에게 상태 변경 알림 전송
    if (document && document.user_id && oldStatus !== status) {
      const typeLabel =
        document.type === "estimate"
          ? "견적서"
          : document.type === "order"
            ? "발주서"
            : "문서";

      if (!updated_by || updated_by !== document.user_id) {
        await createNotification(
          document.user_id,
          "system",
          "문서 상태 변경",
          `${typeLabel} "${document.document_number}"의 상태가 ${getStatusLabel(oldStatus)} → ${getStatusLabel(status)}로 변경되었습니다.`,
          id,
          "document"
        );
      }

      if (document.type === "estimate" && status === "completed") {
        await createNotification(
          document.user_id,
          "estimate_completed",
          "견적서 완료 - 출고 등록",
          `견적서 "${document.document_number}" (${companyName})가 완료되어 출고 리스트에 등록되었습니다.\n• 거래처: ${companyName}\n• 문서번호: ${document.document_number}`,
          id,
          "document"
        );
      }

      if (document.type === "order" && status === "completed") {
        await createNotification(
          document.user_id,
          "order_completed",
          "발주서 완료 - 입고 등록",
          `발주서 "${document.document_number}" (${companyName})가 완료되어 입고 리스트에 등록되었습니다.\n• 거래처: ${companyName}\n• 문서번호: ${document.document_number}`,
          id,
          "document"
        );
      }
    }

    return NextResponse.json(
      { message: "Document status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update document status", details: error },
      { status: 500 }
    );
  }
}
