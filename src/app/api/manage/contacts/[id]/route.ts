import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // URL 파라미터에서 상담 ID 추출

  try {
    // 1️⃣ 담당자 정보 가져오기
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (contactError) {
      return NextResponse.json(
        { error: "담당자 정보를 불러오는 데 실패했습니다." },
        { status: 500 }
      );
    }

    // 2️⃣ 상담 내역 가져오기
    const { data: consultationData, error: consultationError } = await supabase
      .from("contacts_consultations")
      .select(
        "consultations (id, date, content -> total_amount, priority, companies(name))"
      )
      .eq("contact_id", id);

    if (consultationError) {
      return NextResponse.json(
        { error: "상담 정보를 불러오는 데 실패했습니다." },
        { status: 500 }
      );
    }

    const formattedConsultations = consultationData.map((c: any) => ({
      id: c.consultations.id,
      date: c.consultations.date,
      content: c.consultations.content,
      priority: c.consultations.priority,
    }));

    // 3️⃣ 문서 내역 가져오기
    const { data: documentData, error: documentError } = await supabase
      .from("contacts_documents")
      .select(
        "document_id, documents (id, document_number, type, created_at, content)"
      )
      .eq("contact_id", id);

    if (documentError) {
      return NextResponse.json(
        { error: "문서 정보를 불러오는 데 실패했습니다." },
        { status: 500 }
      );
    }

    const formattedDocuments = documentData.map((d: any) => ({
      id: d.documents.id,
      document_number: d.documents.document_number,
      type: d.documents.type,
      created_at: d.documents.created_at,
      content: d.documents.content,
    }));

    // 4️⃣ 매출 및 매입 분석 (Revenue & Purchase Analysis)
    // 🔹 `estimate` 타입 문서 (매출 관련)
    const estimateDocuments = formattedDocuments.filter(
      (doc) => doc.type === "estimate"
    );

    // 🔹 `order` 타입 문서 (매입 관련)
    const orderDocuments = formattedDocuments.filter(
      (doc) => doc.type === "order"
    );

    // 🔥 총 매출 금액 (totalRevenue)
    const totalRevenue = estimateDocuments.reduce((sum, doc) => {
      const totalAmount = doc.content?.total_amount || 0;
      return sum + totalAmount;
    }, 0);

    // 🔥 평균 견적 금액 (averageEstimateValue)
    const averageEstimateValue =
      estimateDocuments.length > 0
        ? totalRevenue / estimateDocuments.length
        : 0;

    // 🔥 월별 매출 변화 (monthlyRevenue)
    const monthlyRevenue: Record<string, number> = {};
    estimateDocuments.forEach((doc) => {
      const date = new Date(doc.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!monthlyRevenue[key]) {
        monthlyRevenue[key] = 0;
      }
      monthlyRevenue[key] += doc.content?.total_amount || 0;
    });

    // 🔥 총 매입 금액 (totalPurchaseAmount)
    const totalPurchaseAmount = orderDocuments.reduce((sum, doc) => {
      const totalAmount = doc.content?.total_amount || 0;
      return sum + totalAmount;
    }, 0);

    return NextResponse.json({
      contact,
      consultations: formattedConsultations,
      documents: formattedDocuments,
      revenueAnalysis: {
        totalRevenue, // 🔹 총 매출 금액 (견적서 기반)
        averageEstimateValue, // 🔹 평균 견적 금액
        monthlyRevenue, // 🔹 월별 매출 변화
        totalPurchaseAmount, // 🔹 총 매입 금액 (발주서 기반)
      },
    });
  } catch (error) {
    console.error("Error fetching contact details:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
